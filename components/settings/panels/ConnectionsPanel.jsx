"use client";
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardBody, CardFooter } from "../components/ui/Card.jsx";
import { StatusTag } from "../components/ui/StatusTag.jsx";
import { Field, FieldGrid, Input, Select } from "../components/ui/Field.jsx";
import Button from "../components/ui/Button.jsx";
import { Badge } from "../components/ui/StatusTag.jsx";
import { RefreshIcon, WhatsAppIcon, EmailIcon } from "../components/ui/Icons.jsx";
import FloatingSave from "../components/ui/FloatingSave.jsx";

export default function ConnectionsPanel({ onSave, showToast }) {
  const [testing, setTesting] = useState({ whatsapp: false, email: false });

  const testConnection = (key, label) => {
    setTesting((t) => ({ ...t, [key]: true }));
    setTimeout(() => {
      setTesting((t) => ({ ...t, [key]: false }));
      showToast(`${label} connection is healthy`);
    }, 1100);
  };

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle icon={WhatsAppIcon} title="WhatsApp Business API" />
          <StatusTag status="on">Connected</StatusTag>
        </CardHeader>
        <CardBody>
          <FieldGrid>
            <Field
              label="Provider"
              hint="Direct billing through Meta — no BSP markup, but you manage rate limits yourself."
            >
              <Select defaultValue="Meta Cloud API (direct)">
                <option>Meta Cloud API (direct)</option>
                <option>Twilio</option>
                <option>Gupshup</option>
                <option>360dialog</option>
              </Select>
            </Field>
            <Field label="WhatsApp Number">
              <div className="flex gap-2">
                <div className="w-[92px] shrink-0">
                  <Select defaultValue="+91" className="px-2">
                    <option>+91</option>
                    <option>+1</option>
                    <option>+44</option>
                    <option>+971</option>
                  </Select>
                </div>
                <div className="flex-1 min-w-0">
                  <Input defaultValue="98765 43210" />
                </div>
              </div>
            </Field>
            <Field label="Access Token">
              <Input type="password" mono defaultValue="EAAG7f9x2kLmQoP310a" />
            </Field>
            <Field label="Webhook">
              <Input mono readOnly value="✓ receiving · last message 2 min ago" />
            </Field>
          </FieldGrid>
        </CardBody>
        <CardFooter>
          <Button
            variant="secondary"
            icon={RefreshIcon}
            loading={testing.whatsapp}
            disabled={testing.whatsapp}
            onClick={() => testConnection("whatsapp", "WhatsApp")}
          >
            {testing.whatsapp ? "Testing…" : "Test Connection"}
          </Button>
          <Button variant="danger">Disconnect</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle icon={EmailIcon} title="Email / SMTP" />
          <StatusTag status="on">Connected</StatusTag>
        </CardHeader>
        <CardBody>
          <FieldGrid>
            <Field label="SMTP Host">
              <Input mono defaultValue="smtp.sendgrid.net" />
            </Field>
            <Field label="Port">
              <Input mono defaultValue="587 (TLS)" />
            </Field>
            <Field label="Username">
              <Input defaultValue="agent1@callzenza.com" />
            </Field>
            <Field label="Password / API Key">
              <Input type="password" defaultValue="••••••••••••" />
            </Field>
            <Field label="Sending domain authentication" full>
              <div className="flex gap-2 flex-wrap">
                <Badge variant="approved">✓ SPF</Badge>
                <Badge variant="approved">✓ DKIM</Badge>
                <Badge variant="approved">✓ DMARC</Badge>
              </div>
            </Field>
          </FieldGrid>
        </CardBody>
        <CardFooter>
          <Button
            variant="secondary"
            icon={RefreshIcon}
            loading={testing.email}
            disabled={testing.email}
            onClick={() => testConnection("email", "Email")}
          >
            {testing.email ? "Testing…" : "Test Connection"}
          </Button>
          <Button variant="danger">Disconnect</Button>
        </CardFooter>
      </Card>

      <FloatingSave onSave={onSave} />
    </div>
  );
}
