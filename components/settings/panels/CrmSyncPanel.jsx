"use client";
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardBody } from "../components/ui/Card.jsx";
import { StatusTag } from "../components/ui/StatusTag.jsx";
import { RowLine, Field, Select } from "../components/ui/Field.jsx";
import { TableWrap, Th, Td } from "../components/ui/Table.jsx";
import { AvatarSm } from "../components/ui/Avatar.jsx";
import FloatingSave from "../components/ui/FloatingSave.jsx";

const FIELD_ROWS = [
  { id: 1, avatar: "Ph", color: "default", field: "mobile_phone", mapsTo: "WhatsApp number", group: "prim1", checked: true },
  { id: 2, avatar: "Ph", color: "teal", field: "work_phone", mapsTo: "WhatsApp number (fallback)", group: "prim1", checked: false },
  { id: 3, avatar: "@", color: "pink", field: "email_primary", mapsTo: "Email address", group: "prim2", checked: true },
  { id: 4, avatar: "Nm", color: "amber", field: "full_name", mapsTo: "Display name", group: null, checked: null },
];

export default function CrmSyncPanel({ onSave }) {
  const [primary, setPrimary] = useState({ prim1: 1, prim2: 3 });
  const [dedupe, setDedupe] = useState({ phone: true, emailName: false });

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle
            title="Field mapping"
            description="Both panels read from your CRM lead list, not a separate address book"
          />
        </CardHeader>
        <TableWrap>
          <thead>
            <tr>
              <Th>CRM field</Th>
              <Th>Maps to</Th>
              <Th>Primary</Th>
            </tr>
          </thead>
          <tbody>
            {FIELD_ROWS.map((row) => (
              <tr key={row.id}>
                <Td>
                  <AvatarSm color={row.color}>{row.avatar}</AvatarSm>
                  {row.field}
                </Td>
                <Td>{row.mapsTo}</Td>
                <Td>
                  {row.group ? (
                    <input
                      type="radio"
                      name={row.group}
                      checked={primary[row.group] === row.id}
                      onChange={() => setPrimary((p) => ({ ...p, [row.group]: row.id }))}
                      className="accent-accent"
                    />
                  ) : (
                    "—"
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle title="Dedupe rules" description="What to do when a lead has two numbers or two emails" />
        </CardHeader>
        <CardBody>
          <RowLine
            title="Merge leads sharing a phone number"
            checked={dedupe.phone}
            onChange={() => setDedupe((d) => ({ ...d, phone: !d.phone }))}
          />
          <RowLine
            title="Merge leads sharing an email domain + name match"
            checked={dedupe.emailName}
            onChange={() => setDedupe((d) => ({ ...d, emailName: !d.emailName }))}
            last
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle title="Sync frequency" />
          <StatusTag status="on">Live</StatusTag>
        </CardHeader>
        <CardBody>
          <Field label="Update cadence">
            <Select defaultValue="Real-time (webhook)">
              <option>Real-time (webhook)</option>
              <option>Every 5 minutes</option>
              <option>Every 15 minutes</option>
              <option>Hourly</option>
            </Select>
          </Field>
        </CardBody>
      </Card>

      <FloatingSave onSave={onSave} />
    </div>
  );
}
