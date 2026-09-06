# Detailed Requirements Specification

## Project: Modern Server Administration Console

**Inspired by:** [Cockpit Project](https://github.com/cockpit-project/cockpit)  
**Architecture:**  
- **Backend:** Go-based service (REST/gRPC + WebSocket)  
- **Frontend:** React + Vite + Tailwind CSS  

**Version:** 1.0  
**Date:** 2026-09-05  

---

## 1. Project Overview

### 1.1 Purpose
Build a modern, lightweight, web-based Linux server administration console that provides an intuitive graphical interface for common system administration tasks. The system shall replicate and modernize the core functionality of the Cockpit project while using a clean separation of concerns with a Go backend service and a React frontend.

### 1.2 Goals
- Provide real-time visibility into system health, resources, and logs.
- Enable common administrative tasks without requiring deep CLI knowledge.
- Maintain high performance and low resource usage when idle.
- Support secure authentication and privilege escalation.
- Deliver a responsive, modern UI using React, Vite, and Tailwind CSS.
- Ensure the backend is efficient, concurrent, and suitable for production use on Linux systems.

### 1.3 Non-Goals (Out of Scope for Initial Version)
- Multi-host management / jump hosts.
- Virtual machine management (libvirt/KVM).
- Container management (Podman/Docker).
- SELinux policy management.
- Advanced clustering / high-availability features.

### 1.4 Target Users
- System administrators (both novice and experienced).
- Developers managing their own servers.
- Operators who prefer graphical tools alongside CLI.

### 1.5 Technology Stack

| Layer          | Technology                                      |
|----------------|-------------------------------------------------|
| Backend        | Go (Golang) 1.22+                               |
| API Style      | REST + WebSocket (real-time metrics & terminal) |
| Frontend       | React 18+, TypeScript, Vite, Tailwind CSS       |
| State Management | Zustand / React Query (or equivalent)         |
| Authentication | Session-based + optional JWT / PAM integration  |
| System Access  | Direct Linux APIs, systemd D-Bus, journald, etc. |
| Deployment     | Single binary backend + static frontend assets, packaged and distributed as a **Debian (.deb) package** and installed/managed as a **systemd service** |

---

## 2. High-Level Architecture

### 2.1 Components
1. **Go Backend Service**
   - HTTP/HTTPS server
   - Authentication & session management
   - System information collectors
   - Privileged operations via capability-aware processes or polkit
   - WebSocket handlers for real-time data and terminal

2. **React Frontend**
   - SPA with client-side routing
   - Responsive layout with collapsible sidebar
   - Real-time dashboards via WebSocket
   - Form-heavy administrative interfaces

3. **Communication**
   - REST API for CRUD operations
   - WebSocket for metrics streaming, logs streaming, and terminal I/O
   - Server-Sent Events (optional alternative for one-way streams)

### 2.2 Security Requirements
- Authenticate using system credentials (PAM preferred).
- Support privilege escalation (sudo / polkit) for administrative actions.
- Enforce least privilege: non-admin users see limited information.
- All privileged operations must be audited.
- HTTPS required in production.
- CSRF protection and secure session cookies.
- Input validation and sanitization on all endpoints.
- Rate limiting on authentication and sensitive endpoints.

---

## 3. Functional Requirements by Feature

### 3.1 System Menu

#### 3.1.1 Overview / Dashboard

**Description**  
Central landing page providing at-a-glance system health, resource usage, and key configuration details.

**Functional Requirements**

| ID | Requirement | Priority |
|----|-------------|----------|
| OV-01 | Display real-time CPU usage (overall + per-core) with historical sparkline/graph (last 5–60 minutes). | Must |
| OV-02 | Display real-time Memory usage (used, available, buffers/cache, swap). | Must |
| OV-03 | Display real-time Disk I/O (read/write throughput and IOPS) aggregated and per major device. | Must |
| OV-04 | Display real-time Network throughput (RX/TX) aggregated and per interface. | Must |
| OV-05 | Show system information: hostname, OS name/version, kernel version, uptime, architecture, CPU model, number of cores/threads. | Must |
| OV-06 | Show hardware summary: total RAM, number of disks, network interfaces. | Must |
| OV-07 | Display system health indicators: failed services count, pending software updates count, disk space warnings. | Must |
| OV-08 | Allow setting hostname (with confirmation). | Should |
| OV-09 | Allow setting system time / timezone / NTP configuration. | Should |
| OV-10 | Provide Restart and Shutdown actions (with confirmation dialog and optional delay). | Must |
| OV-11 | Show last login information and current session details. | Could |
| OV-12 | Support performance profile selection if available on the system (e.g., tuned). | Could |
| OV-13 | Metrics must update at least every 2–5 seconds via WebSocket. | Must |
| OV-14 | Graphs must be interactive (hover tooltips, time range selection). | Should |

**UI/UX Notes**
- Card-based layout for metrics.
- Responsive design (mobile-friendly summary view).
- Color-coded health status (green / yellow / red).
- Dark and light theme support.

**Backend Notes**
- Use `/proc`, `sysfs`, and optional `pcp` or `prometheus` node exporter patterns.
- Prefer efficient collectors that can be polled or pushed via WebSocket.
- Cache static system information.

---

#### 3.1.2 Storage

**Description**  
Manage local storage devices, partitions, filesystems, LVM, RAID, encryption, and network mounts.

**Functional Requirements**

| ID | Requirement | Priority |
|----|-------------|----------|
| ST-01 | List all block devices (disks, partitions, LVs, MD RAID, loop devices) with size, type, model, serial, and usage. | Must |
| ST-02 | Display filesystem usage (mount point, type, size, used, available, % used) for all mounted filesystems. | Must |
| ST-03 | Show real-time disk I/O graphs (throughput and IOPS). | Must |
| ST-04 | Support creating partitions on unallocated space. | Must |
| ST-05 | Support formatting partitions/volumes with common filesystems (ext4, xfs, btrfs, vfat, swap). | Must |
| ST-06 | Support mounting and unmounting filesystems (with fstab integration option). | Must |
| ST-07 | Support LVM: create/delete Volume Groups, Logical Volumes, resize LVs. | Must |
| ST-08 | Support basic software RAID (mdadm) creation and management. | Should |
| ST-09 | Support LUKS encryption: create encrypted devices, unlock/lock, change passphrase. | Should |
| ST-10 | Support NFS mounts: add, remove, show status. | Should |
| ST-11 | Support iSCSI initiator basic operations (discover, login, logout). | Could |
| ST-12 | Show storage-related journal logs. | Must |
| ST-13 | Display warnings for low disk space and failed devices. | Must |
| ST-14 | Provide detailed view for each storage object (properties, related logs, actions). | Must |
| ST-15 | All destructive operations require explicit confirmation and, where appropriate, privilege check. | Must |

**UI/UX Notes**
- Hierarchical or tabular view of storage objects.
- Clear visual distinction between physical disks, partitions, VGs, LVs, RAID arrays.
- Usage bars with color thresholds.
- Action menus context-sensitive to object type.

**Backend Notes**
- Prefer `udisks2` / `storaged` D-Bus APIs where available.
- Fall back to direct `lsblk`, `blkid`, `lvm`, `mdadm`, `cryptsetup`, `mount` commands with careful parsing.
- Maintain consistency with `/etc/fstab` and `/etc/crypttab` when user requests persistence.

---

#### 3.1.3 Networking

**Description**  
View and configure network interfaces, bonds, bridges, VLANs, and firewall.

**Functional Requirements**

| ID | Requirement | Priority |
|----|-------------|----------|
| NW-01 | List all network interfaces with status (up/down), MAC, MTU, IP addresses (IPv4/IPv6), and current throughput. | Must |
| NW-02 | Show real-time RX/TX graphs per interface and aggregate. | Must |
| NW-03 | Display connection details (DHCP vs static, gateway, DNS servers, search domains). | Must |
| NW-04 | Support configuring static IP addresses, DHCP, and dual-stack. | Must |
| NW-05 | Support creating and managing bonds, bridges, and VLANs (NetworkManager preferred). | Should |
| NW-06 | Support Wi-Fi if present: scan, connect, disconnect, forget networks. | Should |
| NW-07 | Firewall management: list zones, services, ports; add/remove rules; enable/disable firewall. | Must |
| NW-08 | Show networking-related journal logs. | Must |
| NW-09 | Display routing table and basic diagnostics (ping, traceroute – optional). | Could |
| NW-10 | Highlight interfaces with errors or carrier loss. | Should |
| NW-11 | All configuration changes must be validated before applying and support rollback where feasible. | Must |

**UI/UX Notes**
- Interface cards or table with status indicators.
- Dedicated firewall section with zone selector.
- Clear “Apply” vs “Temporary” change distinction if supported by backend.

**Backend Notes**
- Prefer NetworkManager D-Bus API (`nmcli` / libnm).
- Firewall via `firewalld` D-Bus or `nftables`/`iptables` abstraction.
- Graceful degradation when NetworkManager or firewalld is absent.

---

#### 3.1.4 Accounts

**Description**  
Manage local user accounts and groups.

**Functional Requirements**

| ID | Requirement | Priority |
|----|-------------|----------|
| AC-01 | List all local user accounts with UID, primary group, home directory, shell, account status (locked/expired). | Must |
| AC-02 | Create new user accounts (username, full name, password, groups, home directory, shell). | Must |
| AC-03 | Edit existing accounts (password change, groups, shell, lock/unlock, expire). | Must |
| AC-04 | Delete user accounts (with option to remove home directory). | Must |
| AC-05 | Manage groups: list, create, delete, add/remove members. | Must |
| AC-06 | Display and manage authorized SSH public keys for a user. | Should |
| AC-07 | Show last login information per user. | Should |
| AC-08 | Enforce password policy awareness (length, complexity) if system supports it. | Could |
| AC-09 | Prevent modification of critical system accounts without explicit warning. | Must |
| AC-10 | All account changes must be audited. | Must |

**UI/UX Notes**
- Clean table of users with search/filter.
- Modal or side panel for create/edit forms.
- Visual indicators for locked or expired accounts.

**Backend Notes**
- Use standard tools: `useradd`, `usermod`, `userdel`, `groupadd`, `passwd`, `chage`, etc., or libuser / accountsservice if available.
- Respect `/etc/login.defs` and PAM configuration.
- Never store plaintext passwords; use system password hashing.

---

#### 3.1.5 Services

**Description**  
Inspect and control systemd units (services, timers, sockets, targets, etc.).

**Functional Requirements**

| ID | Requirement | Priority |
|----|-------------|----------|
| SV-01 | List systemd units with name, description, load state, active state, sub-state. | Must |
| SV-02 | Support filtering by type (service, timer, socket, target, path, mount, etc.), state, and free-text search. | Must |
| SV-03 | Show detailed view of a unit: status, properties, dependencies (Requires, Wants, Conflicts, etc.), recent logs. | Must |
| SV-04 | Actions: Start, Stop, Restart, Reload, Enable, Disable, Mask, Unmask. | Must |
| SV-05 | Show failed units prominently (on Overview and Services page). | Must |
| SV-06 | Support both system and user units (with appropriate privilege checks). | Should |
| SV-07 | Display unit file contents (read-only) and indicate if overridden. | Should |
| SV-08 | Link to related journal logs for the unit. | Must |
| SV-09 | Support creating simple transient units or overriding units (advanced). | Could |

**UI/UX Notes**
- Sortable, filterable table.
- Status badges (active, inactive, failed, activating…).
- Confirmation dialogs for destructive actions (mask, disable critical services).

**Backend Notes**
- Primary interface: systemd D-Bus API.
- Fallback to `systemctl` parsing if needed (less preferred).
- Stream journal logs for selected unit via WebSocket or journal API.

---

#### 3.1.6 Logs

**Description**  
Browse, filter, and search systemd journal logs.

**Functional Requirements**

| ID | Requirement | Priority |
|----|-------------|----------|
| LG-01 | Display recent journal entries in reverse chronological order. | Must |
| LG-02 | Support filtering by priority/severity (emerg → debug), time range, unit/service, and free-text search. | Must |
| LG-03 | Support live/follow mode (streaming new entries). | Must |
| LG-04 | Show structured fields when available (PRIORITY, SYSLOG_IDENTIFIER, MESSAGE, _SYSTEMD_UNIT, etc.). | Must |
| LG-05 | Provide detailed view of a single log entry (all fields). | Must |
| LG-06 | Support exporting filtered logs (text / JSON). | Should |
| LG-07 | Pause/resume live stream. | Must |
| LG-08 | Highlight errors and critical messages. | Must |
| LG-09 | Correlate logs with other views (e.g., jump from service detail to its logs). | Should |
| LG-10 | Handle large journals efficiently (pagination or virtual scrolling). | Must |

**UI/UX Notes**
- Virtualized list for performance.
- Color-coded severity.
- Quick filters for common severities and time ranges (last hour, today, last 7 days…).
- Search box with debouncing.

**Backend Notes**
- Use `journalctl` with structured output (JSON) or systemd journal API (sd-journal).
- Efficient streaming for follow mode via WebSocket.
- Support cursor-based pagination.

---

### 3.2 Tools Menu

#### 3.2.1 File Browser (Custom Implementation)

**Description**  
A full-featured web-based file manager for the server filesystem, supporting navigation, upload, download, preview, editing, and permission management.

**Functional Requirements**

| ID | Requirement | Priority |
|----|-------------|----------|
| FB-01 | Browse the entire filesystem (respecting user permissions). Default start location: user home directory. | Must |
| FB-02 | Support list view and grid/icon view. | Must |
| FB-03 | Breadcrumb navigation and direct path input. | Must |
| FB-04 | Create new files and directories. | Must |
| FB-05 | Rename, delete (with confirmation), copy, cut, paste files and directories. | Must |
| FB-06 | Multi-select support. | Must |
| FB-07 | Upload files via button and drag-and-drop (multiple files). Show progress and support cancellation. | Must |
| FB-08 | Download single files and (optionally) directories as archives. | Must |
| FB-09 | Preview support for common file types: text, images, PDF, audio, video (where browser allows). | Must |
| FB-10 | Basic text editor for configuration files (with unsaved changes warning). | Must |
| FB-11 | View and edit permissions (owner, group, mode) and ownership. Support multi-file permission changes when applicable. | Must |
| FB-12 | Create symbolic links. | Should |
| FB-13 | Show hidden files toggle. | Must |
| FB-14 | Sorting by name, size, modified date, type. | Must |
| FB-15 | Search within current directory (and optionally recursive). | Should |
| FB-16 | Bookmarks / favorites for frequently used directories. | Should |
| FB-17 | Context menu with relevant actions. | Must |
| FB-18 | Display file properties (size, timestamps, permissions, owner, MIME type, SELinux context if available). | Must |
| FB-19 | Conflict resolution on upload (overwrite / rename / skip). | Must |
| FB-20 | Respect filesystem permissions; clearly indicate when an action is denied. | Must |
| FB-21 | Support large file uploads with chunking or resumable uploads (nice-to-have). | Could |

**UI/UX Notes**
- Familiar desktop-file-manager paradigm.
- Drag-and-drop visual feedback.
- Modal dialogs for rename, permissions, delete confirmation.
- Split-pane or dual-pane optional (future).
- Keyboard shortcuts (Delete, F2, Ctrl+C/V/X, etc.).

**Backend Notes**
- File operations via Go standard library + careful privilege handling.
- Upload endpoint must stream data and enforce size limits / quotas.
- Preview generation for images/PDFs may use temporary conversion or direct streaming with proper Content-Type.
- Path traversal protection is critical.
- Prefer running file operations as the authenticated user; elevate only when explicitly authorized and necessary.

---

#### 3.2.2 Terminal

**Description**  
Web-based interactive terminal session to the host.

**Functional Requirements**

| ID | Requirement | Priority |
|----|-------------|----------|
| TM-01 | Provide a full interactive terminal (PTY) in the browser. | Must |
| TM-02 | Support multiple concurrent terminal sessions/tabs. | Should |
| TM-03 | Resize terminal on window/container resize. | Must |
| TM-04 | Support copy/paste (including right-click and keyboard). | Must |
| TM-05 | Session runs as the authenticated user (with ability to use sudo). | Must |
| TM-06 | Support terminal themes / color schemes. | Should |
| TM-07 | Reconnect handling on temporary network interruption. | Should |
| TM-08 | Idle timeout / session timeout configurable. | Must |
| TM-09 | Record or audit terminal sessions (optional, configurable). | Could |
| TM-10 | Support font size adjustment. | Should |

**UI/UX Notes**
- Full-screen capable.
- Tabbed interface if multiple sessions.
- Clear visual indication of connection status.
- Use a mature frontend terminal emulator (xterm.js or equivalent).

**Backend Notes**
- Use Go libraries for PTY handling (`creack/pty` or similar).
- WebSocket bidirectional stream for stdin/stdout/stderr and resize events.
- Proper signal handling and process cleanup on disconnect.
- Resource limits (CPU, memory) per session recommended.

---

#### 3.2.3 Software Updates

**Description**  
View available package updates and apply them via the system package manager (PackageKit / dnf / apt / zypper abstraction).

**Functional Requirements**

| ID | Requirement | Priority |
|----|-------------|----------|
| SU-01 | Check for available updates and display list with package name, current version, new version, size, and severity/priority if available. | Must |
| SU-02 | Show changelog / release notes when available. | Should |
| SU-03 | Support selecting individual packages or “Update All”. | Must |
| SU-04 | Apply updates with progress indication and live log output. | Must |
| SU-05 | Support reboot-required indication after updates. | Must |
| SU-06 | Automatic update configuration (enable/disable, schedule) if supported by backend package manager. | Should |
| SU-07 | History of past update transactions. | Could |
| SU-08 | Handle package manager locks and concurrent operations gracefully. | Must |
| SU-09 | Support both RPM-based (dnf/yum/PackageKit) and DEB-based (apt) systems via abstraction layer. | Must |
| SU-10 | Security updates highlighted. | Should |

**UI/UX Notes**
- Clear list with checkboxes.
- Progress bar + expandable log during update.
- Warning when reboot is required.
- Disable conflicting actions while update is running.

**Backend Notes**
- Prefer PackageKit D-Bus API for cross-distro compatibility.
- Fall back to native tools (`dnf`, `apt`, `zypper`) with structured output parsing.
- Long-running operations must be cancellable where possible and report progress via WebSocket or polling.

---

## 4. Cross-Cutting Requirements

### 4.1 Authentication & Authorization
- Login with system username/password (PAM).
- Optional support for SSH key / certificate authentication in future.
- Session management with secure, HttpOnly, SameSite cookies.
- Role awareness: regular user vs administrative privileges.
- Privilege escalation prompts for sensitive actions.

### 4.2 Real-Time Communication
- WebSocket endpoint(s) for:
  - Metrics streaming (Overview, Storage, Networking)
  - Log following
  - Terminal I/O
  - Long-running job progress (updates, storage operations)

### 4.3 Internationalization (i18n)
- All user-facing strings externalized.
- Support for multiple languages (start with English).
- Date/time and number formatting according to locale.

### 4.4 Accessibility
- WCAG 2.1 AA compliance target.
- Keyboard navigable.
- Sufficient color contrast.
- Screen-reader friendly labels and ARIA attributes.

### 4.5 Performance
- Backend idle resource usage should be minimal.
- Frontend initial load < 2–3 s on typical connections.
- Smooth 60 fps interactions where possible.
- Efficient handling of large log volumes and directory listings (virtualization, pagination).

### 4.6 Observability
- Structured logging from backend.
- Health/readiness endpoints.
- Optional metrics endpoint (Prometheus format).

### 4.7 Error Handling
- Consistent error response format (code, message, details).
- User-friendly error messages in UI.
- Retry logic for transient failures.
- Clear indication when backend connection is lost.

---

## 5. Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| Reliability | Backend must recover cleanly from process crashes; no orphaned privileged processes. |
| Security | Follow secure coding practices; regular dependency scanning; principle of least privilege. |
| Scalability | Designed primarily for single-host administration; must remain responsive under moderate concurrent admin sessions. |
| Maintainability | Clean modular Go packages; well-structured React component hierarchy; comprehensive documentation. |
| Testability | Unit tests for core backend logic; integration tests for critical flows; frontend component tests. |
| Compatibility | Support major modern Linux distributions (Fedora, RHEL/CentOS Stream, Ubuntu, Debian, openSUSE). |
| Browser Support | Latest two versions of Chrome, Firefox, Safari, Edge. |

---

## 6. API Design Guidelines (High Level)

- RESTful resource-oriented endpoints under `/api/v1/`.
- Consistent JSON request/response bodies.
- WebSocket endpoints under `/ws/...`.
- Authentication required for all endpoints except health/login.
- Pagination, filtering, and sorting conventions documented.
- OpenAPI / Swagger specification to be maintained.

**Example Resource Groups**
- `/api/v1/system` – overview, hostname, time, power
- `/api/v1/storage` – devices, filesystems, LVM, RAID
- `/api/v1/network` – interfaces, connections, firewall
- `/api/v1/accounts` – users, groups
- `/api/v1/services` – systemd units
- `/api/v1/logs` – journal queries
- `/api/v1/files` – file browser operations
- `/api/v1/updates` – software updates
- `/ws/metrics`, `/ws/logs`, `/ws/terminal/{id}`

---

## 7. Frontend Structure Recommendations

```
src/
├── components/          # Shared UI components
├── features/
│   ├── overview/
│   ├── storage/
│   ├── networking/
│   ├── accounts/
│   ├── services/
│   ├── logs/
│   ├── files/
│   ├── terminal/
│   └── updates/
├── hooks/               # Custom React hooks
├── lib/                 # API client, utilities
├── stores/              # Global state
├── styles/              # Tailwind + global CSS
└── App.tsx
```

- Feature-based folder structure.
- Tailwind for rapid, consistent styling.
- Prefer composition over heavy inheritance.
- Use React Query (or SWR) for server state.
- Zustand or Context for lightweight client state.

---

## 8. Backend Structure Recommendations

```
cmd/
└── server/              # Main entrypoint
internal/
├── api/                 # HTTP handlers & routing
├── auth/                # Authentication & sessions
├── system/              # Overview / metrics collectors
├── storage/
├── network/
├── accounts/
├── services/
├── journal/
├── files/
├── updates/
├── terminal/
├── ws/                  # WebSocket hub
└── platform/            # Linux-specific helpers
pkg/                     # Public libraries if needed
```

- Clear package boundaries.
- Dependency injection where beneficial.
- Context-aware cancellation for long-running operations.

---

## 9. Packaging & Deployment Requirements

The final deliverable **must** be distributable and installable as a proper system service via a Debian package (`.deb`).

### 9.1 Packaging Format
- The application shall be packaged as a **Debian (`.deb`) package**.
- The package must support installation on Debian-based distributions (Debian, Ubuntu, and derivatives).
- Package name recommendation: `server-admin-console` (or final product name).
- The package shall contain:
  - The compiled Go backend binary.
  - Static frontend assets (built with Vite).
  - systemd unit file(s).
  - Configuration files (with sensible defaults).
  - Documentation (man pages or README if applicable).
  - Necessary post-install / pre-remove scripts.

### 9.2 Systemd Service
- The backend **must** run as a **systemd service**.
- A properly written `.service` unit file shall be provided and installed under `/lib/systemd/system/` or `/usr/lib/systemd/system/`.
- Recommended service characteristics:
  - `Type=notify` or `Type=simple` (prefer `notify` if using sd_notify).
  - Runs under a dedicated unprivileged system user (e.g. `server-admin` or `sac`) with minimal capabilities.
  - Supports socket activation (optional but preferred, similar to Cockpit’s model) **or** traditional port binding.
  - Automatic restart on failure (`Restart=on-failure`).
  - Hardening directives (e.g. `NoNewPrivileges=`, `ProtectSystem=`, `ProtectHome=`, `PrivateTmp=`, capability bounding set, etc.) shall be applied where feasible.
  - EnvironmentFile support for configuration overrides.
- The service shall be enabled by default after package installation (or clearly documented how to enable it).
- Standard targets: `systemctl start|stop|restart|status|enable|disable <service-name>`.

### 9.3 Installation Layout (Recommended)
```
/usr/bin/<binary-name>                 # Main Go binary
/usr/share/<package-name>/web/         # Static frontend assets
/etc/<package-name>/config.yaml        # Main configuration file
/lib/systemd/system/<service>.service  # systemd unit
/var/lib/<package-name>/               # Runtime data (if needed)
/var/log/<package-name>/               # Log directory (or journal only)
```

### 9.4 Package Build Requirements
- The build process must produce a reproducible `.deb` package.
- Support for building the package via:
  - `dpkg-buildpackage` / `debuild`
  - Or a modern alternative such as `nfpm`, `fpm`, or GoReleaser with deb support.
- The package must declare appropriate dependencies (e.g. `systemd`, libraries required by the Go binary if not statically linked).
- Prefer static linking of the Go binary where practical to minimize runtime dependencies.
- Package shall include a `postinst` script that:
  - Creates the dedicated system user/group if needed.
  - Reloads systemd daemon.
  - Optionally enables and starts the service.
- Package shall include a `prerm` / `postrm` script for clean removal.

### 9.5 Configuration & Runtime
- Configuration shall be externalized (YAML, TOML, or environment variables).
- Default listening port should be configurable (suggestion: 9090 to stay familiar with Cockpit users, or another high port).
- TLS/HTTPS support must be configurable (certificates path, automatic self-signed for development, etc.).
- The service must support running behind a reverse proxy (correct handling of `X-Forwarded-*` headers).

### 9.6 Upgrade & Uninstall
- Package upgrades must preserve configuration files (use `conffiles`).
- Clean uninstall must stop the service and remove unit files without leaving orphaned processes.
- Database or persistent state (if any) handling during upgrade/removal shall be defined.

### 9.7 Additional Packaging Goals (Nice-to-have)
- Provide an equivalent RPM package (`.rpm`) for RHEL/Fedora/CentOS Stream in a later phase.
- Support installation via a dedicated APT repository.
- Include AppArmor / SELinux policy snippets if required for confined operation.

---

## 10. Implementation Phases (Suggested)

**Phase 1 – Foundation**
- Authentication & session management
- Overview / Dashboard (metrics)
- Basic layout and navigation
- Logs (read-only + follow)

**Phase 2 – Core Administration**
- Services
- Accounts
- Networking (view + basic config)
- Software Updates

**Phase 3 – Storage & Advanced**
- Full Storage management
- File Browser (core operations + upload/download)
- Terminal

**Phase 4 – Polish, Packaging & Hardening**
- Advanced networking (bonds, bridges, firewall polish)
- File Browser previews & editor
- Accessibility, i18n, performance tuning
- **Debian (.deb) packaging and systemd service integration**
- Comprehensive testing and documentation

---

## 11. Success Criteria

- An administrator can perform the majority of day-to-day server management tasks through the web UI without needing the CLI.
- The interface feels responsive and modern.
- Security posture is equal to or better than comparable tools.
- The system runs efficiently on modest hardware.
- Codebase is maintainable and well-documented for future contributors.
- **The application can be installed, started, stopped, enabled, and upgraded cleanly via a `.deb` package and managed as a standard systemd service.**

---

## 12. References

- Cockpit Project: https://github.com/cockpit-project/cockpit
- Cockpit Documentation: https://cockpit-project.org/
- Cockpit Files: https://github.com/cockpit-project/cockpit-files
- systemd, NetworkManager, udisks2, PackageKit, journald documentation
- Debian Policy Manual & systemd service best practices

---

*This document serves as the authoritative requirements baseline for the initial implementation. Changes should be managed through a formal change process.*
