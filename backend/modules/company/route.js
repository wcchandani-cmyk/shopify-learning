const router = require("express").Router();
const sessionVerifier = require("../../middleware/sessionVerifier");
const {
  searchCompanies,
  createCompany,
  assignCustomerToCompany,
  getCustomerCompany,
  removeCustomerFromCompany,
  listCompanies,
  getCompanyDetails,
  assignRoles,
  revokeRoles,
  updateCompany,
  setMainContact,
  addContactToCompany,
  removeContact,
  listEligibleCustomers,
  listStaff,
  updateAssignedStaff,
  sendAccessEmail,
  bulkDeleteCompanies,
} = require("./controller");

router.get("/list", sessionVerifier, listCompanies);
router.get("/search", sessionVerifier, searchCompanies);
router.get("/staff", sessionVerifier, listStaff);
router.get("/eligible-customers", sessionVerifier, listEligibleCustomers);
router.post("/", sessionVerifier, createCompany);
router.post("/assign", sessionVerifier, assignCustomerToCompany);
  router.post("/bulk-delete", sessionVerifier, bulkDeleteCompanies);
  router.post("/add-contact", sessionVerifier, addContactToCompany);
router.post("/contact/assign-roles", sessionVerifier, assignRoles);
router.post("/contact/revoke-roles", sessionVerifier, revokeRoles);
router.post("/contact/remove", sessionVerifier, removeContact);
router.post("/contact/send-invite", sessionVerifier, sendAccessEmail);
router.get("/customer/:customerId", sessionVerifier, getCustomerCompany);
router.delete("/customer/:customerId", sessionVerifier, removeCustomerFromCompany);
router.put("/:id", sessionVerifier, updateCompany);
router.post("/:id/main-contact", sessionVerifier, setMainContact);
router.post("/:id/staff", sessionVerifier, updateAssignedStaff);
router.get("/:id", sessionVerifier, getCompanyDetails);

module.exports = router;
