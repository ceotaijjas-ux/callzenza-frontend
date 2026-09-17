"use client";
import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardBody } from "../components/ui/Card.jsx";
import { Field, FieldGrid, Input, Select, Textarea } from "../components/ui/Field.jsx";
import { AvatarChip } from "../components/ui/Avatar.jsx";
import Button from "../components/ui/Button.jsx";
import { IdentityIcon, EmailIcon } from "../components/ui/Icons.jsx";
import FloatingSave from "../components/ui/FloatingSave.jsx";
import { businessService } from "@/lib/services/business.service";

export default function BusinessIdentityPanel({ showToast }) {
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [avatarPreview, setAvatarPreview] = useState(null);

  useEffect(() => {
    businessService.me().then(b => {
      setName(b.name);
      setIndustry(b.industry || "");
    }).catch(console.error);
  }, []);

  const handleSave = async () => {
    try {
      await businessService.update({ name, industry });
      showToast("Settings updated successfully!");
    } catch (err) {
      showToast(err.message || "Failed to update settings");
    }
  };

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0];
    if (file) setAvatarPreview(URL.createObjectURL(file));
  };

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle
            icon={IdentityIcon}
            title="WhatsApp business profile"
            description="What customers see when they open a chat with you"
          />
        </CardHeader>
        <CardBody>
          <FieldGrid>
            <Field label="Company / Organization Name">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Acme Corp" />
            </Field>
            <Field label="Industry">
              <Input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="e.g. Retail, Tech" />
            </Field>
            <Field label="Avatar" full>
              <div className="flex items-center gap-3 flex-wrap">
                <AvatarChip size={44} className="rounded-xl">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="" className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    "C"
                  )}
                </AvatarChip>
                <Button variant="secondary" type="button" onClick={() => document.getElementById("avatar-upload").click()}>
                  Upload image
                </Button>
                <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                <span className="text-[11px] text-text-tertiary">Square PNG, at least 192×192px</span>
              </div>
            </Field>
            <Field label="About" full>
              <Input defaultValue="We reply fast — usually within 15 minutes." />
            </Field>
            <Field
              label="Greeting message"
              full
              hint="Sent automatically to first-time contacts before an agent joins."
            >
              <Textarea defaultValue={"Hi 👋 thanks for messaging CallZenza. An agent will be with you shortly — feel free to share your order number so we can jump right in."} />
            </Field>
          </FieldGrid>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle
            icon={EmailIcon}
            title="Email sender identity"
            description="Name and signature attached to every outbound email"
          />
        </CardHeader>
        <CardBody>
          <FieldGrid>
            <Field label="From name">
              <Input defaultValue="CallZenza Support" />
            </Field>
            <Field label="Reply-to address">
              <Input defaultValue="support@callzenza.com" />
            </Field>
            <Field label="Signature" full>
              <Textarea
                defaultValue={"Warm regards,\nThe CallZenza Team\nsupport@callzenza.com · +1 (555) 019-2814"}
              />
            </Field>
          </FieldGrid>
        </CardBody>
      </Card>

      <FloatingSave onSave={handleSave} />
    </div>
  );
}
