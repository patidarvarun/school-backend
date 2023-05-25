var multer = require("multer");

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "invoicespdfs");
  },
  filename: function (req, file, cb) {

    console.log(file);

    cb(null, file.fieldname + "-" + Date.now());
  },
});

var upload = multer({ storage: storage });

//const uploads = multer({ storage: storage });
module.exports = upload;
