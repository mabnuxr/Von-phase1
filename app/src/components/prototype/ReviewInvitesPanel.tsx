import { useState } from "react";
import { XIcon } from "@phosphor-icons/react";

// ─── Mock invite list (49 users) ──────────────────────────────────────────────

const INVITE_USERS = [
  { id: 1,  name: "Alex Turner",      email: "alex.turner@meridiantech.com" },
  { id: 2,  name: "Brianna Cole",     email: "brianna.cole@meridiantech.com" },
  { id: 3,  name: "Carlos Mendez",    email: "carlos.mendez@meridiantech.com" },
  { id: 4,  name: "Diana Foster",     email: "diana.foster@meridiantech.com" },
  { id: 5,  name: "Ethan Brooks",     email: "ethan.brooks@meridiantech.com" },
  { id: 6,  name: "Fiona Walsh",      email: "fiona.walsh@meridiantech.com" },
  { id: 7,  name: "Gabriel Santos",   email: "gabriel.santos@meridiantech.com" },
  { id: 8,  name: "Hannah Kim",       email: "hannah.kim@meridiantech.com" },
  { id: 9,  name: "Ivan Petrov",      email: "ivan.petrov@meridiantech.com" },
  { id: 10, name: "Jasmine Reed",     email: "jasmine.reed@meridiantech.com" },
  { id: 11, name: "Kai Nakamura",     email: "kai.nakamura@meridiantech.com" },
  { id: 12, name: "Leila Hassan",     email: "leila.hassan@meridiantech.com" },
  { id: 13, name: "Marco Ricci",      email: "marco.ricci@meridiantech.com" },
  { id: 14, name: "Natalie Hughes",   email: "natalie.hughes@meridiantech.com" },
  { id: 15, name: "Omar Farouk",      email: "omar.farouk@meridiantech.com" },
  { id: 16, name: "Paige Bennett",    email: "paige.bennett@meridiantech.com" },
  { id: 17, name: "Quinn O'Brien",    email: "quinn.obrien@meridiantech.com" },
  { id: 18, name: "Rachel Stone",     email: "rachel.stone@meridiantech.com" },
  { id: 19, name: "Samuel Torres",    email: "samuel.torres@meridiantech.com" },
  { id: 20, name: "Tara Mitchell",    email: "tara.mitchell@meridiantech.com" },
  { id: 21, name: "Ulysses Grant",    email: "ulysses.grant@meridiantech.com" },
  { id: 22, name: "Vanessa Park",     email: "vanessa.park@meridiantech.com" },
  { id: 23, name: "William Chu",      email: "william.chu@meridiantech.com" },
  { id: 24, name: "Xena Blair",       email: "xena.blair@meridiantech.com" },
  { id: 25, name: "Yasmin Patel",     email: "yasmin.patel@meridiantech.com" },
  { id: 26, name: "Zach Coleman",     email: "zach.coleman@meridiantech.com" },
  { id: 27, name: "Amber Flynn",      email: "amber.flynn@meridiantech.com" },
  { id: 28, name: "Ben Hartley",      email: "ben.hartley@meridiantech.com" },
  { id: 29, name: "Chloe Vance",      email: "chloe.vance@meridiantech.com" },
  { id: 30, name: "Derek Owens",      email: "derek.owens@meridiantech.com" },
  { id: 31, name: "Elena Marsh",      email: "elena.marsh@meridiantech.com" },
  { id: 32, name: "Felix Wagner",     email: "felix.wagner@meridiantech.com" },
  { id: 33, name: "Grace Hayden",     email: "grace.hayden@meridiantech.com" },
  { id: 34, name: "Henry Liu",        email: "henry.liu@meridiantech.com" },
  { id: 35, name: "Iris Cooper",      email: "iris.cooper@meridiantech.com" },
  { id: 36, name: "Jake Morrison",    email: "jake.morrison@meridiantech.com" },
  { id: 37, name: "Kayla Simmons",    email: "kayla.simmons@meridiantech.com" },
  { id: 38, name: "Liam Perez",       email: "liam.perez@meridiantech.com" },
  { id: 39, name: "Maya Robinson",    email: "maya.robinson@meridiantech.com" },
  { id: 40, name: "Noah Jenkins",     email: "noah.jenkins@meridiantech.com" },
  { id: 41, name: "Olivia Shaw",      email: "olivia.shaw@meridiantech.com" },
  { id: 42, name: "Patrick Dunn",     email: "patrick.dunn@meridiantech.com" },
  { id: 43, name: "Rosa Flores",      email: "rosa.flores@meridiantech.com" },
  { id: 44, name: "Sean Murphy",      email: "sean.murphy@meridiantech.com" },
  { id: 45, name: "Tiffany Young",    email: "tiffany.young@meridiantech.com" },
  { id: 46, name: "Uma Krishnan",     email: "uma.krishnan@meridiantech.com" },
  { id: 47, name: "Victor Lane",      email: "victor.lane@meridiantech.com" },
  { id: 48, name: "Wendy Nguyen",     email: "wendy.nguyen@meridiantech.com" },
  { id: 49, name: "Yusuf Ahmed",      email: "yusuf.ahmed@meridiantech.com" },
];

// ─── Avatar helpers ───────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  "bg-violet-100 text-violet-700",
  "bg-blue-100 text-blue-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-cyan-100 text-cyan-700",
  "bg-orange-100 text-orange-700",
  "bg-indigo-100 text-indigo-700",
];

function avatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function initials(name: string) {
  const parts = name.trim().split(" ");
  return (parts.length >= 2 ? parts[0][0] + parts[parts.length - 1][0] : name.slice(0, 2)).toUpperCase();
}

// ─── Component ────────────────────────────────────────────────────────────────

interface ReviewInvitesPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (count: number) => void;
  inline?: boolean;
}

export function ReviewInvitesPanel({ isOpen, onClose, onSend, inline }: ReviewInvitesPanelProps) {
  const [checked, setChecked] = useState<Set<number>>(() => new Set(INVITE_USERS.map((u) => u.id)));

  const allChecked = checked.size === INVITE_USERS.length;
  const selectedCount = checked.size;

  function toggleAll() {
    setChecked(allChecked ? new Set() : new Set(INVITE_USERS.map((u) => u.id)));
  }

  function toggle(id: number) {
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const panelContent = (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3 flex-shrink-0">
        <div>
          <p className="text-sm font-semibold text-gray-900">Review invites</p>
          <p className="text-xs text-gray-400 mt-0.5">{INVITE_USERS.length} people · Member role</p>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors cursor-pointer flex-shrink-0"
        >
          <XIcon size={15} weight="bold" />
        </button>
      </div>

      <div className="h-px bg-gray-100 flex-shrink-0" />

      {/* Select-all row */}
      <div className="flex items-center gap-3 px-5 py-2.5 flex-shrink-0">
        <input
          type="checkbox"
          checked={allChecked}
          onChange={toggleAll}
          className="w-3.5 h-3.5 rounded accent-gray-900 cursor-pointer flex-shrink-0"
        />
        <span className="text-xs text-gray-500 select-none">Select all</span>
        {selectedCount < INVITE_USERS.length && (
          <span className="text-xs text-gray-400">{selectedCount} of {INVITE_USERS.length} selected</span>
        )}
      </div>

      <div className="h-px bg-gray-100 flex-shrink-0" />

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {INVITE_USERS.map((user) => (
          <label
            key={user.id}
            className="flex items-center gap-3 px-5 py-2.5 hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-50 last:border-b-0"
          >
            <input
              type="checkbox"
              checked={checked.has(user.id)}
              onChange={() => toggle(user.id)}
              className="w-3.5 h-3.5 rounded accent-gray-900 cursor-pointer flex-shrink-0"
            />
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold flex-shrink-0 ${avatarColor(user.name)}`}>
              {initials(user.name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
              <p className="text-xs text-gray-400 truncate">{user.email}</p>
            </div>
          </label>
        ))}
      </div>

      {/* Sticky footer */}
      <div className="flex-shrink-0 border-t border-gray-200 px-5 py-3.5 flex items-center justify-end gap-2">
        <button
          onClick={onClose}
          className="px-3.5 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          onClick={() => onSend(selectedCount)}
          disabled={selectedCount === 0}
          className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Send {selectedCount} invite{selectedCount !== 1 ? "s" : ""}
        </button>
      </div>
    </>
  );

  if (inline) {
    return (
      <div className="w-[480px] flex-shrink-0 h-full bg-white border-l border-gray-200 flex flex-col overflow-hidden">
        {panelContent}
      </div>
    );
  }

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/25 transition-opacity duration-300 ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />
      <div
        className={`fixed top-0 right-0 bottom-0 z-50 w-[480px] bg-white shadow-xl border-l border-gray-200 flex flex-col transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        {panelContent}
      </div>
    </>
  );
}
