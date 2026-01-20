import type { User } from '@collab/shared';

interface SidebarProps {
  users: User[];
  currentUser: User;
  roomId: string;
  rooms: string[];
  status: 'connected' | 'reconnecting' | 'offline';
  lastSync?: Date;
  isOpen: boolean;
  onClose: () => void;
  onRoomSelect?: (roomId: string) => void;
  onCreateRoom?: () => void;
}

export default function Sidebar({
  users,
  currentUser,
  roomId,
  rooms,
  status,
  lastSync,
  isOpen,
  onClose,
  onRoomSelect,
  onCreateRoom,
}: SidebarProps) {
  // Get user color based on ID (consistent with cursor colors)
  const getUserColor = (userId: string): string => {
    const colors = [
      '#6366F1', // indigo
      '#06B6D4', // cyan
      '#10B981', // emerald
      '#F59E0B', // amber
      '#8B5CF6', // violet
      '#F43F5E', // rose
    ];
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = (hash * 31 + userId.charCodeAt(i)) >>> 0;
    }
    return colors[hash % colors.length];
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusValueClass = () => {
    switch (status) {
      case 'connected':
        return 'sidebar__status-value--connected';
      case 'reconnecting':
        return 'sidebar__status-value--reconnecting';
      default:
        return '';
    }
  };

  const formatTimestamp = (date?: Date): string => {
    if (!date) return 'Never';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? 'sidebar-overlay--visible' : ''}`} onClick={onClose} />
      <div className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}>
        {/* Active Users */}
        <div className="sidebar__section">
          <div className="sidebar__section-title">Active Users</div>
          <div className="sidebar__users-list">
            {users.length === 0 ? (
              <div style={{ color: '#6B7280', fontSize: '12px', padding: '8px' }}>
                You're alone here... invite someone
              </div>
            ) : (
              users.map((user) => {
                const color = getUserColor(user.id);
                const isCurrentUser = user.id === currentUser.id;
                return (
                  <div key={user.id} className="sidebar__users-item">
                    <div
                      className="sidebar__users-avatar"
                      style={{
                        background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
                      }}
                    >
                      <span>{getInitials(user.name)}</span>
                      <div
                        className="sidebar__users-avatar-ring"
                        style={{ borderColor: color }}
                      />
                    </div>
                    <div className="sidebar__users-info">
                      <div className="sidebar__users-name">
                        {user.name}
                        {isCurrentUser && ' (You)'}
                      </div>
                      <div className="sidebar__users-status">
                        <span>Active</span>
                      </div>
                    </div>
                    <div
                      className="sidebar__users-cursor-dot"
                      style={{ background: color }}
                    />
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Rooms */}
        <div className="sidebar__section">
          <div className="sidebar__section-title">Rooms</div>
          <div className="sidebar__rooms-list">
            {rooms.map((room) => (
              <div
                key={room}
                className={`sidebar__rooms-item ${
                  room === roomId ? 'sidebar__rooms-item--active' : ''
                }`}
                onClick={() => onRoomSelect?.(room)}
              >
                {room}
              </div>
            ))}
          </div>
          {onCreateRoom && (
            <button className="sidebar__rooms-create" onClick={onCreateRoom}>
              + Create room
            </button>
          )}
        </div>

        {/* System Status */}
        <div className="sidebar__section" style={{ marginTop: 'auto' }}>
          <div className="sidebar__section-title">System Status</div>
          <div className="sidebar__status-item">
            <span className="sidebar__status-label">Connection</span>
            <span className={`sidebar__status-value ${getStatusValueClass()}`}>
              {status === 'connected'
                ? 'Connected'
                : status === 'reconnecting'
                ? 'Reconnecting'
                : 'Offline'}
            </span>
          </div>
          {lastSync && (
            <div className="sidebar__status-timestamp">
              Last sync: {formatTimestamp(lastSync)}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
