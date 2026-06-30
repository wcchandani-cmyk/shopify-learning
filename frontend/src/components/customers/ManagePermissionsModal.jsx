import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { assignContactRoles, revokeContactRoles } from "../../services/companyService";
import { exclusiveFieldLabel } from "../../utils/formFields";
import { getInputEventValue, getCheckboxChecked } from "../../utils/fieldEvent";

export default function ManagePermissionsModal({
  open,
  shopify,
  company,
  contact,
  onClose,
  onSaved,
}) {
  const modalRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selections, setSelections] = useState({});
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState("select");

  // The modal stays mounted even when no contact is selected (so closing hides
  // the overlay instead of tearing the element out), so guard against null.
  const safeContact = contact || {};
  const contactRoleAssignments = safeContact.roleAssignments;

  useEffect(() => {
    const modal = modalRef.current;
    if (!modal) return;
    if (open) modal.showOverlay?.();
    else modal.hideOverlay?.();
  }, [open]);

  useEffect(() => {
    if (open) {
      setStep("select");
      setSearchQuery("");
    }
  }, [open]);

  // Available roles (default to "Ordering only" or fallback role)
  const availableRoles = useMemo(() => {
    return company.contactRoles || [{ id: "Ordering only", name: "Ordering only" }];
  }, [company.contactRoles]);

  const defaultRoleId = useMemo(() => {
    return availableRoles[0]?.id || "";
  }, [availableRoles]);

  // Initialize selections from existing role assignments
  useEffect(() => {
    const initial = {};
    company.locations.forEach((loc) => {
      const assignment = contactRoleAssignments?.find(
        (assignment) => assignment.locationId === loc.id
      );
      if (assignment) {
        initial[loc.id] = {
          checked: true,
          roleId: assignment.roleId,
          assignmentId: assignment.id,
        };
      } else {
        initial[loc.id] = {
          checked: false,
          roleId: defaultRoleId,
          assignmentId: null,
        };
      }
    });
    setSelections(initial);
  }, [open, company.locations, contactRoleAssignments, defaultRoleId]);

  const handleCheckboxChange = (locId, checked) => {
    setSelections((prev) => ({
      ...prev,
      [locId]: {
        ...prev[locId],
        checked,
      },
    }));
  };

  const handleRoleChange = (locId, roleId) => {
    setSelections((prev) => ({
      ...prev,
      [locId]: {
        ...prev[locId],
        roleId,
      },
    }));
  };

  const handleSave = useCallback(async () => {
    if (saving || !safeContact.id) return;
    setSaving(true);

    try {
      const rolesToAssign = [];
      const roleAssignmentIdsToRevoke = [];

      company.locations.forEach((loc) => {
        const state = selections[loc.id];
        const original = contactRoleAssignments?.find(
          (a) => a.locationId === loc.id
        );

        if (!state) return;

        if (state.checked) {
          if (!original) {
            rolesToAssign.push({
              companyContactRoleId: state.roleId,
              companyLocationId: loc.id,
            });
          } else if (original.roleId !== state.roleId) {
            roleAssignmentIdsToRevoke.push(original.id);
            rolesToAssign.push({
              companyContactRoleId: state.roleId,
              companyLocationId: loc.id,
            });
          }
        } else if (original) {
          roleAssignmentIdsToRevoke.push(original.id);
        }
      });

      if (roleAssignmentIdsToRevoke.length > 0) {
        await revokeContactRoles({
          companyContactId: safeContact.id,
          roleAssignmentIds: roleAssignmentIdsToRevoke,
        });
      }

      if (rolesToAssign.length > 0) {
        await assignContactRoles({
          companyContactId: safeContact.id,
          rolesToAssign,
        });
      }

      shopify.toast.show("Permissions updated successfully");
      onSaved();
      onClose();
    } catch (err) {
      shopify.toast.show(err.message || "Failed to update permissions", {
        isError: true,
      });
    } finally {
      setSaving(false);
    }
  }, [selections, company.locations, contactRoleAssignments, safeContact.id, shopify, saving, onSaved, onClose]);

  const filteredLocations = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    if (!term) return company.locations;
    return company.locations.filter((loc) =>
      loc.name.toLowerCase().includes(term)
    );
  }, [company.locations, searchQuery]);

  const roleNameById = useMemo(() => {
    const map = {};
    availableRoles.forEach((role) => {
      map[role.id] = role.name;
    });
    return map;
  }, [availableRoles]);

  const selectedSummary = useMemo(() => {
    return company.locations
      .filter((loc) => selections[loc.id]?.checked)
      .map((loc) => ({
        id: loc.id,
        name: loc.name,
        roleName: roleNameById[selections[loc.id]?.roleId] || "Ordering only",
      }));
  }, [company.locations, selections, roleNameById]);

  const customerName =
    safeContact.customer?.displayName ||
    safeContact.customer?.email ||
    "this customer";

  const handleNext = () => setStep("review");
  const handleBack = () => setStep("select");

  const handleAfterHide = useCallback(
    (event) => {
      if (event.target === event.currentTarget) onClose();
    },
    [onClose]
  );

  return (
    <s-modal
      id="manage-permissions-modal"
      ref={modalRef}
      heading="Manage customer permissions"
      onAfterHide={handleAfterHide}
    >
      {step === "select" ? (
        <s-stack gap="base" stretch>
          <s-paragraph>
            Select <strong>{company.name}</strong> locations to give{" "}
            <strong>{customerName}</strong> permission to order.
          </s-paragraph>

          <s-text-field
            label="Search locations"
            {...exclusiveFieldLabel}
            icon="search"
            placeholder="Search locations"
            value={searchQuery}
            onInput={(event) => setSearchQuery(getInputEventValue(event))}
          />

          <div style={{ maxHeight: "300px", overflowY: "auto", border: "1px solid #e3e3e3", borderRadius: "8px", padding: "8px" }}>
            {filteredLocations.length === 0 ? (
              <s-text color="subdued">No locations found</s-text>
            ) : (
              filteredLocations.map((loc) => {
                const state = selections[loc.id] || { checked: false, roleId: defaultRoleId };
                return (
                  <div key={loc.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 4px", borderBottom: "1px solid #f1f2f4" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <s-checkbox
                        id={`loc-check-${loc.id}`}
                        checked={state.checked || undefined}
                        onChange={(event) => handleCheckboxChange(loc.id, getCheckboxChecked(event))}
                      />
                      <label htmlFor={`loc-check-${loc.id}`} style={{ fontSize: "14px", fontWeight: 500, color: "#303030", cursor: "pointer" }}>
                        {loc.name}
                      </label>
                    </div>
                    {state.checked && (
                      <div style={{ width: "160px" }}>
                        <s-select
                          label="Role"
                          labelAccessibilityVisibility="exclusive"
                          value={state.roleId}
                          onChange={(event) => handleRoleChange(loc.id, getInputEventValue(event))}
                        >
                          {availableRoles.map((role) => (
                            <s-option key={role.id} value={role.id}>
                              {role.name}
                            </s-option>
                          ))}
                        </s-select>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </s-stack>
      ) : (
        <s-stack gap="base" stretch>
          {selectedSummary.length === 0 ? (
            <s-paragraph>
              No locations are selected. <strong>{customerName}</strong> will not have permission to order. Go back to select locations.
            </s-paragraph>
          ) : (
            <>
              <s-paragraph>
                Review the permissions you're giving <strong>{customerName}</strong>.
              </s-paragraph>
              <div style={{ border: "1px solid #e3e3e3", borderRadius: "8px", padding: "8px" }}>
                {selectedSummary.map((item) => (
                  <div
                    key={item.id}
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 4px", borderBottom: "1px solid #f1f2f4" }}
                  >
                    <span style={{ fontSize: "14px", fontWeight: 500, color: "#303030" }}>
                      {item.name}
                    </span>
                    <s-text color="subdued" size="small">{item.roleName}</s-text>
                  </div>
                ))}
              </div>
            </>
          )}
        </s-stack>
      )}

      {step === "select" ? (
        <s-button slot="primary-action" variant="primary" onClick={handleNext}>
          Next
        </s-button>
      ) : (
        <s-button slot="primary-action" variant="primary" onClick={handleSave} loading={saving || undefined}>
          Save
        </s-button>
      )}

      {step === "select" ? (
        <s-button slot="secondary-actions" onClick={onClose}>
          Cancel
        </s-button>
      ) : (
        <s-button slot="secondary-actions" onClick={handleBack} disabled={saving || undefined}>
          Back
        </s-button>
      )}
    </s-modal>
  );
}
