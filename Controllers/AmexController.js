const axios = require("axios");
module.exports = {
  AmexController: async (req, res) => {
    let config = req.body;
    console.log('config',req.body);
    axios
      .request(config)
      .then((response) => {
        res.status(200).json(response.data);
        //return JSON.stringify(response.data));
      })
      .catch((error) => {
        console.log(error);
        res.status(400).json(error);
      });
  },
  getAmexRetriveOrder: async (req, res) => {
    let config = req.body;
    axios
      .request(config)
      .then((response) => {
        res.status(200).json(response.data);
        //return JSON.stringify(response.data));
      })
      .catch((error) => {
        console.log(error);
        res.status(400).json(error);
      });
  },
};
