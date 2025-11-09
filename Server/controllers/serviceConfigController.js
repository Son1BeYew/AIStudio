const ServiceConfig = require("../models/ServiceConfig");

exports.getAll = async (req, res) => {
  try {
    const configs = await ServiceConfig.find();
    res.json(configs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getByService = async (req, res) => {
  try {
    const { service } = req.params;
    const config = await ServiceConfig.findOne({ service });
    if (!config) {
      return res.json({ service, fee: 0 });
    }
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { service } = req.params;
    const { fee } = req.body;

    let config = await ServiceConfig.findOne({ service });
    if (!config) {
      config = await ServiceConfig.create({ service, fee });
    } else {
      config.fee = fee;
      await config.save();
    }

    res.json(config);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
