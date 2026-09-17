"use client";
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardBody } from "../components/ui/Card.jsx";
import { StatusTag } from "../components/ui/StatusTag.jsx";
import { Field, Select, RowLine } from "../components/ui/Field.jsx";
import { TableWrap, Th, Td, TdSubtle } from "../components/ui/Table.jsx";
import Button from "../components/ui/Button.jsx";

const AUDIT_LOG = [
  { time: "11:04 AM", agent: "agent1", action: <>Sent WhatsApp template <em>order_confirmation</em> to +91 98••••210</> },
  { time: "10:47 AM", agent: "Aditi Rao", action: "Exported contact data for 1 lead" },
  { time: "10:12 AM", agent: "Marcus Chen", action: "Viewed thread (read-only)" },
];

export default function CompliancePanel() {
  const [blockNonConsented, setBlockNonConsented] = useState(true);
  const [autoRecordConsent, setAutoRecordConsent] = useState(true);

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle title="Message retention" />
        </CardHeader>
        <CardBody>
          <Field label="Keep conversation history for">
            <Select defaultValue="1 month">
              <option>24 hrs</option>
              <option>3 days</option>
              <option>1 week</option>
              <option>1 month</option>
              <option>3 months</option>
            </Select>
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle title="WhatsApp opt-in tracking" description="Required before you can message a contact" />
          <StatusTag status="on">Enforced</StatusTag>
        </CardHeader>
        <CardBody>
          <RowLine
            title="Block outbound to non-consented contacts"
            checked={blockNonConsented}
            onChange={setBlockNonConsented}
          />
          <RowLine
            title="Auto-record consent on first inbound message"
            checked={autoRecordConsent}
            onChange={setAutoRecordConsent}
            last
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle title="Data requests" description="For GDPR / DPDP compliance requests" />
        </CardHeader>
        <CardBody className="flex gap-2.5 flex-wrap">
          <Button variant="secondary">Export contact data</Button>
          <Button variant="danger" className="bg-danger-dim">
            Delete contact data
          </Button>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle title="Audit log" description="Who sent what, and when" />
        </CardHeader>
        <TableWrap>
          <thead>
            <tr>
              <Th>Time</Th>
              <Th>Agent</Th>
              <Th>Action</Th>
            </tr>
          </thead>
          <tbody>
            {AUDIT_LOG.map((row, i) => (
              <tr key={i}>
                <Td>
                  <TdSubtle>{row.time}</TdSubtle>
                </Td>
                <Td>{row.agent}</Td>
                <Td>{row.action}</Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </Card>
    </div>
  );
}
