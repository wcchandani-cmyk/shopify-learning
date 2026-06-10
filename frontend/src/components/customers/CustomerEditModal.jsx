import { TAX_SETTING_OPTIONS } from "../../utils/customerForm";
import { getCheckboxChecked, getInputEventValue } from "../../utils/fieldEvent";
import MarketingChannelRow from "./MarketingChannelRow";
import PhoneField from "./PhoneField";
import SearchableSelect from "./SearchableSelect";
import TagEditor from "./TagEditor";

const EDIT_TITLES = {
  contact: "Edit customer",
  address: "Edit default address",
  marketing: "Edit marketing status",
  tax: "Edit tax details",
  tags: "Add tags",
  notes: "Edit notes",
};

export default function CustomerEditModal({
  editModalId,
  modalRef,
  editing,
  draft,
  saving,
  languageOptions,
  availableTags,
  onChangeDraft,
  onSave,
  onAfterHide,
}) {
  const renderBody = () => {
    if (!draft) return null;
    switch (editing) {
      case "contact":
        return (
          <s-stack gap="base">
            <s-grid gap="base" gridTemplateColumns="1fr 1fr">
              <s-text-field
                label="First name"
                value={draft.firstName}
                onInput={(event) =>
                  onChangeDraft({ firstName: getInputEventValue(event) })
                }
              />
              <s-text-field
                label="Last name"
                value={draft.lastName}
                onInput={(event) =>
                  onChangeDraft({ lastName: getInputEventValue(event) })
                }
              />
            </s-grid>
            <SearchableSelect
              label="Language"
              details="This customer will receive notifications in this language."
              value={draft.locale}
              onChange={(val) => onChangeDraft({ locale: val })}
              options={languageOptions}
              placeholder="Search language…"
            />
            <s-text-field
              label="Email"
              type="email"
              value={draft.email}
              onInput={(event) =>
                onChangeDraft({ email: getInputEventValue(event) })
              }
            />
            <PhoneField
              label="Phone number"
              value={draft.phone}
              onChange={(phone) => onChangeDraft({ phone })}
            />
          </s-stack>
        );
      case "marketing":
        return (
          <s-stack gap="base">
            <s-text>
              Indicate which marketing channels the customer has agreed to
              receive messages from:
            </s-text>
            <s-box border="base" borderRadius="base" overflow="hidden">
              <MarketingChannelRow
                iconType="email"
                title="Email"
                subscribed={draft.emailSubscribed}
                detail={draft.email || "No email address"}
                onToggle={(event) =>
                  onChangeDraft({ emailSubscribed: getCheckboxChecked(event) })
                }
              />

              <s-divider />

              <MarketingChannelRow
                iconType="mobile"
                title="SMS"
                subscribed={draft.smsSubscribed}
                detail={draft.phone || "No phone number"}
                onToggle={(event) =>
                  onChangeDraft({ smsSubscribed: getCheckboxChecked(event) })
                }
              />
            </s-box>
          </s-stack>
        );
      case "tax":
        return (
          <s-select
            label="Tax settings"
            value={draft.taxSetting}
            onChange={(event) =>
              onChangeDraft({ taxSetting: getInputEventValue(event) })
            }
          >
            {TAX_SETTING_OPTIONS.map((option) => (
              <s-option key={option.value} value={option.value}>
                {option.label}
              </s-option>
            ))}
          </s-select>
        );
      case "tags":
        return (
          <TagEditor
            value={draft.tags}
            available={availableTags}
            onChange={(tags) => onChangeDraft({ tags: tags.join(", ") })}
          />
        );
      case "notes":
        return (
          <s-text-area
            label="Notes"
            value={draft.note}
            onInput={(event) =>
              onChangeDraft({ note: getInputEventValue(event) })
            }
          />
        );
      default:
        return null;
    }
  };

  return (
    <s-modal
      id={editModalId}
      ref={modalRef}
      heading={EDIT_TITLES[editing] || "Edit customer"}
      onAfterHide={onAfterHide}
    >
      {renderBody()}
      <s-button
        slot="primary-action"
        variant="primary"
        onClick={onSave}
        {...(saving ? { loading: true } : {})}
      >
        Save
      </s-button>
      <s-button slot="secondary-actions" command="--hide" commandFor={editModalId}>
        Cancel
      </s-button>
    </s-modal>
  );
}
