"use client";
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardBody } from "../components/ui/Card.jsx";
import { TableWrap, Th, Td } from "../components/ui/Table.jsx";
import { AvatarSm } from "../components/ui/Avatar.jsx";
import { Badge } from "../components/ui/StatusTag.jsx";
import { Field, FieldGrid, Input, Select, RadioCard } from "../components/ui/Field.jsx";
import Switch from "../components/ui/Switch.jsx";
import Button from "../components/ui/Button.jsx";
import Modal from "../components/ui/Modal.jsx";
import FloatingSave from "../components/ui/FloatingSave.jsx";

const INITIAL_MEMBERS = [
  { id: 1, name: "agent1 (you)", initials: "N", color: "default", role: "Agent", access: "Full", badge: "approved" },
  { id: 2, name: "Aditi Rao", initials: "AR", color: "pink", role: "Agent", access: "Full", badge: "approved" },
  { id: 3, name: "Marcus Chen", initials: "MC", color: "teal", role: "Supervisor", access: "Read-only", badge: "pending" },
  { id: 4, name: "Jenna Diaz", initials: "JD", color: "amber", role: "Agent", access: "No access", badge: "rejected" },
];

const AVATAR_COLORS = ["default", "pink", "teal", "amber"];

const ACCESS_BADGE = {
  Full: "approved",
  "Read-only": "pending",
  "No access": "rejected",
};

function initialsOf(name) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return parts.slice(0, 2).map((w) => w[0].toUpperCase()).join("");
}

export default function TeamPanel({ onSave, showToast }) {
  const [members, setMembers] = useState(INITIAL_MEMBERS);
  const [inboxModel, setInboxModel] = useState("shared");
  const [supervisorVisibility, setSupervisorVisibility] = useState(true);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("Agent");
  const [inviteAccess, setInviteAccess] = useState("Full");

  const openInvite = () => {
    setInviteName("");
    setInviteEmail("");
    setInviteRole("Agent");
    setInviteAccess("Full");
    setInviteOpen(true);
  };

  const addMember = () => {
    const name = inviteName.trim();
    if (!name) return;
    setMembers((prev) => [
      ...prev,
      {
        id: Date.now(),
        name,
        initials: initialsOf(name),
        color: AVATAR_COLORS[prev.length % AVATAR_COLORS.length],
        role: inviteRole,
        access: inviteAccess,
        badge: ACCESS_BADGE[inviteAccess],
      },
    ]);
    setInviteOpen(false);
    showToast?.(`Invited ${name}${inviteEmail ? ` (${inviteEmail})` : ""}`);
  };

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle title="Who can access Messages" />
          <Button variant="primary" onClick={openInvite}>
            + Invite teammate
          </Button>
        </CardHeader>
        <TableWrap>
          <thead>
            <tr>
              <Th>Member</Th>
              <Th>Role</Th>
              <Th>Access</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id}>
                <Td>
                  <AvatarSm color={m.color}>{m.initials}</AvatarSm>
                  {m.name}
                </Td>
                <Td>{m.role}</Td>
                <Td>
                  <Badge variant={m.badge}>{m.access}</Badge>
                </Td>
                <Td>
                  <Button variant="ghost">Manage</Button>
                </Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle title="Inbox model" />
        </CardHeader>
        <CardBody>
          <RadioCard
            name="inbox"
            title="Shared inbox"
            description="Any available agent can pick up any conversation."
            selected={inboxModel === "shared"}
            onSelect={() => setInboxModel("shared")}
          />
          <RadioCard
            name="inbox"
            title="Per-agent assigned"
            description="Conversations only appear for the assigned agent."
            selected={inboxModel === "assigned"}
            onSelect={() => setInboxModel("assigned")}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle title="Supervisor visibility" description="Read-only view across all agents' threads" />
          <Switch
            checked={supervisorVisibility}
            onChange={setSupervisorVisibility}
            aria-label="Supervisor visibility"
          />
        </CardHeader>
      </Card>

      <FloatingSave onSave={onSave} />

      <Modal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="Invite a teammate"
        footer={
          <>
            <Button variant="secondary" onClick={() => setInviteOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={addMember} disabled={!inviteName.trim()}>
              Add
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3.5">
          <Field label="Name">
            <Input
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              placeholder="Priya Nair"
              autoFocus
            />
          </Field>
          <Field label="Email">
            <Input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="priya@callzenza.com"
            />
          </Field>
          <FieldGrid>
            <Field label="Role">
              <Select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>
                <option>Agent</option>
                <option>Supervisor</option>
                <option>Admin</option>
              </Select>
            </Field>
            <Field label="Access">
              <Select value={inviteAccess} onChange={(e) => setInviteAccess(e.target.value)}>
                <option>Full</option>
                <option>Read-only</option>
                <option>No access</option>
              </Select>
            </Field>
          </FieldGrid>
        </div>
      </Modal>
    </div>
  );
}
