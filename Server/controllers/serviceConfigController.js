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

    console.log(`📝 Updating service fee: service=${service}, fee=${fee}`);

    if (!service || fee === undefined) {
      console.error("❌ Missing service or fee");
      return res.status(400).json({ error: "service và fee là bắt buộc" });
    }

    let config = await ServiceConfig.findOne({ service });
    if (!config) {
      console.log("✅ Creating new config for", service);
      config = await ServiceConfig.create({ service, fee });
    } else {
      console.log("✅ Updating existing config for", service);
      config.fee = fee;
      await config.save();
    }

    console.log("✅ Config updated:", config);
    res.json(config);
  } catch (error) {
    console.error("❌ Error updating service config:", error);
    res.status(500).json({ error: error.message });
  }
};
