const Hubspot = require("hubspot");
const mysqlconnection = require("../DB/db.config.connection");
const hubspot = new Hubspot({
  accessToken: "pat-eu1-02f4832a-25b9-451e-abd5-301db699d490",
});

module.exports = {
  //insert data into hub spot
  migrateCustomersToHubSpot: async (data, customerId, id) => {
    const contactObj = {
      properties: [
        {
          property: "firstname",
          value: data.name.split(" ").slice(0, -1).join(" "),
        },
        {
          property: "lastname",
          value: data.name.split(" ").slice(-1).join(" "),
        },
        { property: "email", value: data.email1 },
        { property: "phone", value: data.phoneNumber1 },
        { property: "fid", value: customerId },
        { property: "full_name", value: data.name },
      ],
    };
    const res = await hubspot.contacts.create(contactObj);
    //console.log("hubspot data sync success", res);
    //update meta options add hubspot id
    const updatequery = `update metaoptions set hubSpotUserId = ${res.vid}  where  metaoptions.userId = ${id}`;
    mysqlconnection.query(updatequery, function (err, result) {
      if (err) {
        console.log(err);
      } else {
        console.log("data inserted on hubspot");
      }
    });
  },

  //email engagement in hubspot
  migrateEmailToHubSpot: async (emaildata) => {
    const getqry = `select metaoptions.hubSpotUserId  from metaoptions where metaoptions.userId  = ${emaildata.userid}`;
    mysqlconnection.query(getqry, async function (err, results) {
      if (results.length > 0 && results[0]?.hubSpotUserId !== 0) {
        // create date
        const d1 = new Date();
        // converting to number
        const result = d1.getTime();
        const payload = {
          engagement: {
            active: true,
            ownerId: 866966484,
            type: "EMAIL",
            timestamp: result,
          },
          associations: {
            contactIds: [results[0]?.hubSpotUserId],
            // // companyIds: [],
            // // dealIds: [],
            ownerIds: [866966484],
            // // ticketIds: [],
            associatedCompanyIds: [],
            associatedVids: [results[0]?.hubSpotUserId],
          },
          metadata: {
            from: {
              email: process.env.SMTP_FROM_NAME_EMAIL,
              firstName: "Qatar Inter National School",
              lastName: "OIS",
            },
            to: [
              {
                email: emaildata.email,
              },
            ],
            cc: [],
            bcc: [],
            subject: emaildata.subject,
            html: emaildata.bodyofemail,
            text: emaildata.bodyofemail,
          },
        };
        await hubspot.engagements.create(payload).then((data, err) => {
          if (err) throw err;
          //console.log("hubspot Email Response", data);
        });
      } else {
        console.log(err);
      }
    });
  },
};
