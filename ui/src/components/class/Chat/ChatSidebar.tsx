import {
  Camera,
  Crown,
  Edit3,
  FileText,
  Image,
  Link2,
  Search,
  Shield,
  X,
} from "lucide-react";
import { useState } from "react";

import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

/* ── Types ─────────────────────────────────── */
interface Member {
  id: string;
  name: string;
  avatar?: string;
  role: "owner" | "admin" | "member";
  isOnline: boolean;
  lastSeen?: string;
}

interface SharedMedia {
  id: string;
  type: "image" | "video";
  url: string;
  thumbnail?: string;
}

interface SharedFile {
  id: string;
  name: string;
  size: string;
  type: string;
}

/* ── Mock data ─────────────────────────────── */
const mockMembers: Member[] = [
  { id: "u1", name: "Prof. Wei Chen", role: "owner", isOnline: true },
  { id: "u2", name: "Sarah Kim", role: "admin", isOnline: true, avatar: "" },
  { id: "u3", name: "Alex Johnson", role: "member", isOnline: true },
  { id: "u4", name: "Priya Sharma", role: "member", isOnline: true },
  {
    id: "u5",
    name: "Marcus Lee",
    role: "member",
    isOnline: false,
    lastSeen: "2h ago",
  },
  {
    id: "u6",
    name: "Emma Davis",
    role: "member",
    isOnline: false,
    lastSeen: "5h ago",
  },
  {
    id: "u7",
    name: "Noah Wilson",
    role: "member",
    isOnline: false,
    lastSeen: "1d ago",
  },
  { id: "u8", name: "Olivia Brown", role: "member", isOnline: true },
  {
    id: "u9",
    name: "Liam Martinez",
    role: "member",
    isOnline: false,
    lastSeen: "3h ago",
  },
  { id: "u10", name: "Sophia Garcia", role: "member", isOnline: true },
];

const mockMedia: SharedMedia[] = [
  { id: "m1", type: "image", url: "", thumbnail: "" },
  { id: "m2", type: "image", url: "", thumbnail: "" },
  { id: "m3", type: "image", url: "", thumbnail: "" },
  { id: "m4", type: "video", url: "", thumbnail: "" },
  { id: "m5", type: "image", url: "", thumbnail: "" },
  { id: "m6", type: "image", url: "", thumbnail: "" },
];

const mockSharedFiles: SharedFile[] = [
  { id: "sf1", name: "ML_Week1_Notes.pdf", size: "2.4 MB", type: "pdf" },
  { id: "sf2", name: "Dataset_iris.csv", size: "12 KB", type: "csv" },
  { id: "sf3", name: "Assignment_1.docx", size: "1.1 MB", type: "docx" },
];

const roleIcon = {
  owner: Crown,
  admin: Shield,
  member: null,
};

const roleColor = {
  owner: "text-amber-500",
  admin: "text-primary-500",
  member: "",
};

/* ── Component ─────────────────────────────── */
type Tab = "members" | "media" | "files" | "links";

interface ChatSidebarProps {
  open: boolean;
  onClose: () => void;
  groupName: string;
  groupAvatar?: string;
  groupDescription: string;
  memberCount: number;
  createdAt?: string;
  isAdmin?: boolean;
}

export default function ChatSidebar({
  open,
  onClose,
  groupName,
  groupAvatar,
  groupDescription,
  memberCount,
  createdAt = "Jan 5, 2026",
  isAdmin = false,
}: ChatSidebarProps) {
  const [activeTab, setActiveTab] = useState<Tab>("members");
  const [search, setSearch] = useState("");

  const filteredMembers = mockMembers.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()),
  );

  const onlineMembers = filteredMembers.filter((m) => m.isOnline);
  const offlineMembers = filteredMembers.filter((m) => !m.isOnline);

  const tabs: {
    key: Tab;
    label: string;
    icon: React.ElementType;
    count?: number;
  }[] = [
    { key: "members", label: "Members", icon: Search, count: memberCount },
    { key: "media", label: "Media", icon: Image, count: mockMedia.length },
    {
      key: "files",
      label: "Files",
      icon: FileText,
      count: mockSharedFiles.length,
    },
    { key: "links", label: "Links", icon: Link2, count: 0 },
  ];

  if (!open) return null;

  return (
    <div className="w-[320px] bg-white border-l border-neutral-200/60 flex-shrink-0 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-[60px] border-b border-neutral-200/60 flex-shrink-0">
        <h3 className="text-sm font-bold text-neutral-900">Group Info</h3>
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Group profile */}
        <div className="flex flex-col items-center px-5 py-6">
          <div className="relative group mb-3">
            <Avatar name={groupName} src={groupAvatar} size="xl" />
            {isAdmin && (
              <button className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="h-5 w-5" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <h4 className="text-base font-bold text-neutral-900">
              {groupName}
            </h4>
            {isAdmin && (
              <button className="p-1 rounded-md text-neutral-400 hover:text-primary-600 transition-colors">
                <Edit3 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            {memberCount} members · Created {createdAt}
          </p>
        </div>

        {/* Description */}
        <div className="px-5 pb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
              Description
            </span>
            {isAdmin && (
              <button className="text-[11px] font-medium text-primary-600 hover:text-primary-700 transition-colors">
                Edit
              </button>
            )}
          </div>
          <p className="text-xs text-neutral-600 leading-relaxed">
            {groupDescription}
          </p>
        </div>

        <div className="mx-5 h-px bg-neutral-100" />

        {/* Tabs */}
        <div className="flex border-b border-neutral-100">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex-1 py-3 text-[11px] font-semibold uppercase tracking-wide text-center transition-colors relative",
                activeTab === tab.key
                  ? "text-primary-700"
                  : "text-neutral-400 hover:text-neutral-600",
              )}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="ml-1 text-[10px] opacity-60">{tab.count}</span>
              )}
              {activeTab === tab.key && (
                <div className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-primary-600 rounded-t-full" />
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="p-4">
          {activeTab === "members" && (
            <div className="space-y-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search members…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-200 rounded-xl bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all"
                />
              </div>

              {/* Online members */}
              {onlineMembers.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-success-500 mb-2">
                    Online — {onlineMembers.length}
                  </p>
                  <div className="space-y-0.5">
                    {onlineMembers.map((member) => (
                      <MemberRow key={member.id} member={member} />
                    ))}
                  </div>
                </div>
              )}

              {/* Offline members */}
              {offlineMembers.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-2">
                    Offline — {offlineMembers.length}
                  </p>
                  <div className="space-y-0.5">
                    {offlineMembers.map((member) => (
                      <MemberRow key={member.id} member={member} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "media" && (
            <div className="grid grid-cols-3 gap-1.5">
              {mockMedia.map((media) => (
                <div
                  key={media.id}
                  className="aspect-square rounded-xl bg-gradient-to-br from-neutral-100 to-neutral-200 flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity overflow-hidden"
                >
                  {media.type === "video" ? (
                    <div className="relative w-full h-full bg-neutral-200 flex items-center justify-center">
                      <div className="h-8 w-8 rounded-full bg-black/50 flex items-center justify-center">
                        <div className="ml-0.5 w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-white border-b-[6px] border-b-transparent" />
                      </div>
                    </div>
                  ) : (
                    <Image className="h-5 w-5 text-neutral-400" />
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === "files" && (
            <div className="space-y-2">
              {mockSharedFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-neutral-50 transition-colors cursor-pointer group"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary-600 flex-shrink-0">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-neutral-900 truncate">
                      {file.name}
                    </p>
                    <p className="text-[10px] text-neutral-400">{file.size}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "links" && (
            <div className="flex flex-col items-center justify-center py-8 text-neutral-400">
              <Link2 className="h-8 w-8 mb-2 opacity-40" />
              <p className="text-xs">No shared links yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Member Row ────────────────────────────── */
function MemberRow({ member }: { member: Member }) {
  const RoleIcon = roleIcon[member.role];

  return (
    <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-neutral-50 transition-colors cursor-pointer group">
      <div className="relative flex-shrink-0">
        <Avatar name={member.name} src={member.avatar || undefined} size="sm" />
        <div
          className={cn(
            "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white",
            member.isOnline ? "bg-success-500" : "bg-neutral-300",
          )}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-neutral-900 truncate">
            {member.name}
          </span>
          {RoleIcon && (
            <RoleIcon
              className={cn("h-3 w-3 flex-shrink-0", roleColor[member.role])}
            />
          )}
        </div>
        {!member.isOnline && member.lastSeen && (
          <span className="text-[10px] text-neutral-400">
            Last seen {member.lastSeen}
          </span>
        )}
      </div>
    </div>
  );
}
