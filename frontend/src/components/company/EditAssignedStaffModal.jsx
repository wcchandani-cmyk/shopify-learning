import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  listStaffMembers,
  updateAssignedStaff,
} from "../../services/companyService";
import { getInputEventValue, getCheckboxChecked } from "../../utils/fieldEvent";

export default function EditAssignedStaffModal({
  open,
  shopify,
  company,
  onClose,
  onSaved,
}) {
  const modalRef = useRef(null);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const modal = modalRef.current;
    if (!modal) return;
    if (open) modal.showOverlay?.();
    else modal.hideOverlay?.();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const initial = {};
    (company.assignedStaff || []).forEach((member) => {
      initial[member.staffMemberId] = true;
    });
    setSelected(initial);
    setSearch("");
  }, [open, company.assignedStaff]);

  const locationCounts = useMemo(() => {
    const map = {};
    (company.assignedStaff || []).forEach((member) => {
      map[member.staffMemberId] = member.locationIds?.length || 0;
    });
    return map;
  }, [company.assignedStaff]);

  const totalLocations = (company.locations || []).length;

  useEffect(() => {
    if (!open) return undefined;
    let active = true;
    setLoading(true);
    listStaffMembers()
      .then((result) => {
        if (active) setStaff(result);
      })
      .catch(() => {
        if (active) setStaff([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [open]);

  const filteredStaff = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return staff;
    return staff.filter(
      (member) =>
        member.name.toLowerCase().includes(term) ||
        member.email.toLowerCase().includes(term)
    );
  }, [staff, search]);

  const handleToggle = (staffId, checked) => {
    setSelected((prev) => ({ ...prev, [staffId]: checked }));
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const staffMemberIds = Object.keys(selected).filter((id) => selected[id]);
      await updateAssignedStaff(company.id, staffMemberIds);
      shopify.toast.show("Assigned staff updated");
      onSaved();
      onClose();
    } catch (err) {
      shopify.toast.show(err.message || "Failed to update assigned staff", {
        isError: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAfterHide = useCallback(
    (event) => {
      if (event.target === event.currentTarget) onClose();
    },
    [onClose]
  );

  return (
    <s-modal
      id="edit-assigned-staff-modal"
      ref={modalRef}
      heading="Edit assigned staff"
      onAfterHide={handleAfterHide}
    >
      <s-stack gap="base" stretch>
        <s-paragraph>
          Assign or remove staff from{" "}
          <strong>all locations of {company.name}</strong>.
        </s-paragraph>

        <s-text-field
          label="Search staff"
          labelAccessibilityVisibility="exclusive"
          icon="search"
          placeholder="Search"
          value={search}
          onInput={(e) => setSearch(getInputEventValue(e))}
        />

        <div
          style={{
            maxHeight: "300px",
            overflowY: "auto",
            border: "1px solid #e3e3e3",
            borderRadius: "8px",
            padding: "4px",
          }}
        >
          {loading ? (
            <div style={{ padding: "12px" }}>
              <s-text color="subdued">Loading staff…</s-text>
            </div>
          ) : filteredStaff.length === 0 ? (
            <div style={{ padding: "12px" }}>
              <s-text color="subdued">No staff members found</s-text>
            </div>
          ) : (
            filteredStaff.map((member) => {
              const checked = Boolean(selected[member.id]);
              const count = checked
                ? locationCounts[member.id] ?? totalLocations
                : locationCounts[member.id] ?? 0;
              return (
                <div
                  key={member.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "8px",
                    padding: "8px",
                    borderBottom: "1px solid #f1f2f4",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <s-checkbox
                      id={`staff-${member.id}`}
                      checked={checked || undefined}
                      onChange={(e) => handleToggle(member.id, getCheckboxChecked(e))}
                    />
                    <label
                      htmlFor={`staff-${member.id}`}
                      style={{ display: "flex", flexDirection: "column", cursor: "pointer" }}
                    >
                      <span style={{ fontSize: "14px", fontWeight: 500, color: "#303030" }}>
                        {member.name}
                      </span>
                      {member.email ? (
                        <span style={{ fontSize: "13px", color: "#616161" }}>
                          {member.email}
                        </span>
                      ) : null}
                    </label>
                  </div>
                  <s-text color="subdued" size="small">
                    {count} {count === 1 ? "location" : "locations"}
                  </s-text>
                </div>
              );
            })
          )}
        </div>
      </s-stack>

      <s-button
        slot="primary-action"
        variant="primary"
        onClick={handleSave}
        loading={saving || undefined}
      >
        Save
      </s-button>
      <s-button
        slot="secondary-actions"
        onClick={onClose}
        disabled={saving || undefined}
      >
        Cancel
      </s-button>
    </s-modal>
  );
}
