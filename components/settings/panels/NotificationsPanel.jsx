"use client";
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardBody } from "../components/ui/Card.jsx";
import { RowLine, Field, Select } from "../components/ui/Field.jsx";
import Chip from "../components/ui/Chip.jsx";
import FloatingSave from "../components/ui/FloatingSave.jsx";

const INITIAL_ALERTS = [
  { key: "desktop", title: "Desktop notifications", description: "Show a system pop-up for new messages", checked: true },
  { key: "sound", title: "Sound alerts", description: "Play a chime when a new message arrives", checked: true },
  { key: "whatsapp", title: "WhatsApp alerts", description: "Live ping for every WhatsApp reply", checked: true },
  { key: "email", title: "Email alerts", description: "Live ping for every inbound email", checked: false },
];

const INITIAL_VIPS = [
  { id: 1, name: "Aditi Rao", initials: "AR", color: "pink" },
  { id: 2, name: "Marcus Chen", initials: "MC", color: "teal" },
];

const INITIAL_KEYWORDS = ["cancel", "refund", "legal", "urgent"];

export default function NotificationsPanel({ onSave }) {
  const [alerts, setAlerts] = useState(INITIAL_ALERTS);
  const [vips, setVips] = useState(INITIAL_VIPS);
  const [keywords, setKeywords] = useState(INITIAL_KEYWORDS);

  const toggleAlert = (key) =>
    setAlerts((prev) => prev.map((a) => (a.key === key ? { ...a, checked: !a.checked } : a)));

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle title="Alerts" description="How you're notified of new activity" />
        </CardHeader>
        <CardBody>
          {alerts.map((a, i) => (
            <RowLine
              key={a.key}
              title={a.title}
              description={a.description}
              checked={a.checked}
              onChange={() => toggleAlert(a.key)}
              last={i === alerts.length - 1}
            />
          ))}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle title="Priority alerts" description="Always notify — even if live pings are off elsewhere" />
        </CardHeader>
        <CardBody>
          <Field label="VIP contacts">
            <div className="flex flex-wrap gap-2 mt-1.5">
              {vips.map((v) => (
                <Chip
                  key={v.id}
                  color={v.color}
                  avatarLabel={v.initials}
                  onRemove={() => setVips((prev) => prev.filter((x) => x.id !== v.id))}
                >
                  {v.name}
                </Chip>
              ))}
              <Chip color="dashed">+ Add contact</Chip>
            </div>
          </Field>
          <div className="mt-3.5">
            <Field label="Keyword triggers">
              <div className="flex flex-wrap gap-2 mt-1.5">
                {keywords.map((k) => (
                  <Chip key={k} onRemove={() => setKeywords((prev) => prev.filter((x) => x !== k))}>
                    "{k}"
                  </Chip>
                ))}
              </div>
            </Field>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle title="Email digest" description="A rollup instead of live pings, if you prefer" />
        </CardHeader>
        <CardBody>
          <Field label="Frequency">
            <Select defaultValue="Every hour">
              <option>Off — live alerts only</option>
              <option>Every hour</option>
              <option>Twice daily</option>
              <option>Once daily, 8am</option>
            </Select>
          </Field>
        </CardBody>
      </Card>

      <FloatingSave onSave={onSave} />
    </div>
  );
}
