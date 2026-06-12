import { getInputEventValue, getCheckboxChecked } from "../../utils/fieldEvent";

export default function ActiveDatesSection({ form, updateField }) {
  return (
    <s-section heading="Active dates">
      <s-stack gap="base">
        <div className="side-by-side-row">
          <div className="column-50">
            <s-date-field
              label="Start date"
              value={form.startDate}
              preferredPosition="above"
              preferred-position="above"
              onInput={(event) => updateField("startDate", getInputEventValue(event))}
              onChange={(event) => updateField("startDate", getInputEventValue(event))}
            />
          </div>
          <div className="column-50">
            <s-text-field
              label="Start time (EDT)"
              type="time"
              value={form.startTime}
              onInput={(event) => updateField("startTime", getInputEventValue(event))}
              onChange={(event) => updateField("startTime", getInputEventValue(event))}
            />
          </div>
        </div>

        <div>
          <s-checkbox
            label="Set end date"
            checked={form.hasEndDate}
            onChange={(event) => {
              const checked = getCheckboxChecked(event);
              updateField("hasEndDate", checked);
              if (checked && !form.endDate) {
                updateField("endDate", new Date().toISOString().substring(0, 10));
                updateField("endTime", "11:59 PM");
              }
            }}
          />
        </div>

        {form.hasEndDate && (
          <div className="side-by-side-row">
            <div className="column-50">
              <s-date-field
                label="End date"
                value={form.endDate}
                preferredPosition="above"
                preferred-position="above"
                onInput={(event) => updateField("endDate", getInputEventValue(event))}
                onChange={(event) => updateField("endDate", getInputEventValue(event))}
              />
            </div>
            <div className="column-50">
              <s-text-field
                label="End time (EDT)"
                type="time"
                value={form.endTime}
                onInput={(event) => updateField("endTime", getInputEventValue(event))}
                onChange={(event) => updateField("endTime", getInputEventValue(event))}
              />
            </div>
          </div>
        )}
      </s-stack>
    </s-section>
  );
}
