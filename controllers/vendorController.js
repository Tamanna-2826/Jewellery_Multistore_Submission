const { Vendor, User, Product, VendorKYC } = require("../models");

const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const cloudinary = require("../config/cloudinaryConfig");
const { sendEmail } = require("../helpers/emailHelper");

const {
  generateVendorActivationEmail,
  generateVendorDeactivationEmail,
} = require("../utilities/emailTemplete.js");

const generateRandomPassword = () => {
  const randomBytes = crypto.randomBytes(5);
  const password = randomBytes.toString("hex");
  return password;
};

const vendorRegistration = async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      email,
      password,
      country_code,
      phone_no,
      gstno,
      city_id,
      state_id,
      address,
      company_name,
      business_reg_no,
      aadhar_no,
      pan_no,
      bank_acc_no,
      bank_name,
      ifsc_code,
    } = req.body;

    const existingEmailUser = await User.findOne({ where: { email } });
    const existingPhoneUser = await User.findOne({ where: { phone_no } });

    if (existingEmailUser) {
      return res
        .status(400)
        .json({ message: "Email already exists as a user" });
    }

    if (existingPhoneUser) {
      return res
        .status(400)
        .json({ message: "Phone number already exists as a user" });
    }

    const existingEmailVendor = await Vendor.findOne({ where: { email } });
    const existingPhoneVendor = await Vendor.findOne({ where: { phone_no } });

    if (existingEmailVendor) {
      return res
        .status(400)
        .json({ message: "Email already exists as a vendor" });
    }

    if (existingPhoneVendor) {
      return res
        .status(400)
        .json({ message: "Phone number already exists as a vendor" });
    }
    const newVendor = await Vendor.create({
      first_name,
      last_name,
      email,
      password,
      country_code,
      phone_no,
      gstno,
      city_id,
      state_id,
      address,
      company_name,
      active_status: "pending",
    });

    // Handle file uploads and store public IDs
    let aadharCopyPublicId = null;
    if (req.files && req.files.aadhar_copy) {
      aadharCopyPublicId = req.files.aadhar_copy[0].path;
    }

    let panCopyPublicId = null;
    if (req.files && req.files.pan_copy) {
      panCopyPublicId = req.files.pan_copy[0].path;
    }

    let addProfPublicId = null;
    if (req.files && req.files.add_prof) {
      addProfPublicId = req.files.add_prof[0].path;
    }

    const newVendorKYC = await VendorKYC.create({
      vendor_id: newVendor.vendor_id,
      business_reg_no,
      aadhar_no,
      aadhar_copy: aadharCopyPublicId,
      pan_no,
      pan_copy: panCopyPublicId,
      add_prof: addProfPublicId,
      bank_acc_no,
      bank_name,
      ifsc_code,
    });

    res.status(200).json({
      message: "Vendor registered successfully",
      newVendor,
      newVendorKYC,
    });
  } catch (error) {
    console.error("Error registering vendor:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getVendorDetails = async (req, res) => {
  try {
    const { vendor_id } = req.params;

    const vendorDetails = await Vendor.findOne({
      where: { vendor_id },
      include: [
        {
          model: VendorKYC,
          as: "kycDetails",
        },
      ],
    });

    if (!vendorDetails) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    res.status(200).json({ vendor: vendorDetails });
  } catch (error) {
    console.error("Error fetching vendor details:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const vendorActivation = async (req, res) => {
  const { vendor_id } = req.params;

  try {
    const vendor = await Vendor.findOne({
      where: { vendor_id },
    });

    if (!vendor) {
      return res.status(404).json({ error: "Vendor not found" });
    }

    const tempPassword = generateRandomPassword(2);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    await vendor.update({
      active_status: "active",
      password: hashedPassword,
    });

    const activationHtmlContent = generateVendorActivationEmail(
      vendor,
      tempPassword
    );

    await sendEmail(
      vendor.email,
      "Vendor Account Activation",
      activationHtmlContent
    );

    res.json({ success: true, message: "Vendor status updated to active" });
  } catch (error) {
    console.error("Error activating vendor:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const vendorDeactivation = async (req, res) => {
  const { vendor_id } = req.params;
  try {
    const vendor = await Vendor.findOne({
      where: { vendor_id },
    });

    if (!vendor) {
      return res.status(404).json({ error: "Vendor not found" });
    }
    await Product.destroy({
      where: { vendor_id },
    });

    await vendor.update({ active_status: "deactive" });

    const deactivationHtmlContent = generateVendorDeactivationEmail(vendor);

    await sendEmail(
      vendor.email,
      "Vendor Account Deactivation",
      deactivationHtmlContent
    );
    res.json({ success: true, message: "Vendor deactivated successfully" });
  } catch (error) {
    console.error("Error deactivating vendor:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getPendingVendors = async (req, res) => {
  try {
    const pendingVendors = await Vendor.findAll({
      where: {
        active_status: "pending",
      },
    });

    res.status(200).json({ success: true, pendingVendors });
  } catch (error) {
    console.error("Error fetching pending vendors:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getactiveVendors = async (req, res) => {
  try {
    const activeVendors = await Vendor.findAll({
      where: {
        active_status: "active",
      },
    });

    res.status(200).json({ success: true, activeVendors });
  } catch (error) {
    console.error("Error fetching pending vendors:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
const getdeactiveVendors = async (req, res) => {
  try {
    const deactiveVendors = await Vendor.findAll({
      where: {
        active_status: "deactive",
      },
    });

    res.status(200).json({ success: true, deactiveVendors });
  } catch (error) {
    console.error("Error fetching pending vendors:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const updateVendorPassword = async (req, res) => {
  const { vendor_id } = req.params;
  const { oldPassword, newPassword } = req.body;

  try {
    const vendor = await Vendor.findByPk(vendor_id);

    if (!vendor) {
      return res.status(404).json({ error: "Vendor not found" });
    }

    const isPasswordValid = await bcrypt.compare(oldPassword, vendor.password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: "Invalid old password" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await vendor.update({ password: hashedPassword });

    res.json({
      success: true,
      message: "Vendor password updated successfully",
    });
  } catch (error) {
    console.error("Error updating vendor password:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  vendorRegistration,
  vendorActivation,
  getPendingVendors,
  getactiveVendors,
  vendorDeactivation,
  getdeactiveVendors,
  updateVendorPassword,
  getVendorDetails,
};
