"use client";
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardBody } from "../components/ui/Card.jsx";
import { TableWrap, Th, Td, TdSubtle } from "../components/ui/Table.jsx";
import { Field, Input, Textarea } from "../components/ui/Field.jsx";
import Button from "../components/ui/Button.jsx";
import Chip from "../components/ui/Chip.jsx";
import Modal from "../components/ui/Modal.jsx";
import { LightningIcon, EmailIcon } from "../components/ui/Icons.jsx";

const INITIAL_SNIPPETS = [
  { id: 1, label: "/eta", text: '"Your ETA is roughly…"' },
  { id: 2, label: "/refund", text: '"Refunds take 3-5 days…"' },
  { id: 3, label: "/hours", text: '"We\'re open Mon–Sat, 9-6…"' },
  { id: 4, label: "/human", text: '"Connecting you to an agent…"' },
];

const INITIAL_TEMPLATES = [
  { id: 1, name: "Quote follow-up", subject: "Following up on your quote #{{quote_id}}", edited: "3 days ago" },
  { id: 2, name: "Callback confirmation", subject: "We've booked your callback", edited: "1 week ago" },
  { id: 3, name: "Welcome / onboarding", subject: "Welcome to CallZenza 👋", edited: "2 weeks ago" },
];

export default function TemplatesPanel({ showToast }) {
  const [snippets, setSnippets] = useState(INITIAL_SNIPPETS);
  const [templates, setTemplates] = useState(INITIAL_TEMPLATES);

  // --- New snippet modal ---
  const [snippetOpen, setSnippetOpen] = useState(false);
  const [snippetLabel, setSnippetLabel] = useState("");
  const [snippetText, setSnippetText] = useState("");

  const openSnippetModal = () => {
    setSnippetLabel("");
    setSnippetText("");
    setSnippetOpen(true);
  };

  const addSnippet = () => {
    const label = snippetLabel.trim();
    const text = snippetText.trim();
    if (!label || !text) return; // both fields required — nothing added yet
    setSnippets((prev) => [
      ...prev,
      { id: Date.now(), label: label.startsWith("/") ? label : `/${label}`, text: `"${text}"` },
    ]);
    setSnippetOpen(false);
    showToast?.(`Snippet "${label.startsWith("/") ? label : `/${label}`}" added`);
  };

  // --- New email template modal ---
  const [templateOpen, setTemplateOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateSubject, setTemplateSubject] = useState("");

  const openTemplateModal = () => {
    setTemplateName("");
    setTemplateSubject("");
    setTemplateOpen(true);
  };

  const addTemplate = () => {
    const name = templateName.trim();
    const subject = templateSubject.trim();
    if (!name || !subject) return;
    setTemplates((prev) => [...prev, { id: Date.now(), name, subject, edited: "Just now" }]);
    setTemplateOpen(false);
    showToast?.(`Template "${name}" added`);
  };

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle
            icon={LightningIcon}
            title="Quick-reply snippets"
            description={'Shortcuts agents can drop into WhatsApp or email with "/"'}
          />
          <Button variant="primary" onClick={openSnippetModal}>
            + New snippet
          </Button>
        </CardHeader>
        <CardBody>
          <div className="flex flex-wrap gap-2">
            {snippets.map((s) => (
              <Chip key={s.id} onRemove={() => setSnippets((prev) => prev.filter((x) => x.id !== s.id))}>
                {s.label} — {s.text}
              </Chip>
            ))}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle icon={EmailIcon} title="Saved email templates" description="Common replies for the compose window" />
          <Button variant="primary" onClick={openTemplateModal}>
            + New template
          </Button>
        </CardHeader>
        <TableWrap>
          <thead>
            <tr>
              <Th>Name</Th>
              <Th>Subject line</Th>
              <Th>Last edited</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {templates.map((t) => (
              <tr key={t.id}>
                <Td>{t.name}</Td>
                <Td>
                  <TdSubtle>{t.subject}</TdSubtle>
                </Td>
                <Td>
                  <TdSubtle>{t.edited}</TdSubtle>
                </Td>
                <Td>
                  <Button variant="ghost">Edit</Button>
                </Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </Card>

      <Modal
        open={snippetOpen}
        onClose={() => setSnippetOpen(false)}
        title="New quick-reply snippet"
        footer={
          <>
            <Button variant="secondary" onClick={() => setSnippetOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={addSnippet} disabled={!snippetLabel.trim() || !snippetText.trim()}>
              Add snippet
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3.5">
          <Field label="Shortcut" hint={'Agents type this after "/" — e.g. "eta" becomes /eta'}>
            <Input
              value={snippetLabel}
              onChange={(e) => setSnippetLabel(e.target.value)}
              placeholder="eta"
              autoFocus
            />
          </Field>
          <Field label="Reply text" hint="Added to the list the moment you click Add — no separate save step.">
            <Textarea
              value={snippetText}
              onChange={(e) => setSnippetText(e.target.value)}
              placeholder="Your ETA is roughly…"
              rows={3}
            />
          </Field>
        </div>
      </Modal>

      <Modal
        open={templateOpen}
        onClose={() => setTemplateOpen(false)}
        title="New email template"
        footer={
          <>
            <Button variant="secondary" onClick={() => setTemplateOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={addTemplate}
              disabled={!templateName.trim() || !templateSubject.trim()}
            >
              Add template
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3.5">
          <Field label="Template name">
            <Input
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Quote follow-up"
              autoFocus
            />
          </Field>
          <Field label="Subject line">
            <Input
              value={templateSubject}
              onChange={(e) => setTemplateSubject(e.target.value)}
              placeholder="Following up on your quote #{{quote_id}}"
            />
          </Field>
        </div>
      </Modal>
    </div>
  );
}
