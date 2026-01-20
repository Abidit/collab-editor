import { useState, useEffect } from 'react';
import type { User } from '@collab/shared';

interface TopBarProps {
  roomName: string;
  onRoomNameChange: (name: string) => void;
  users: User[];
  status: 'connected' | 'reconnecting' | 'offline';
  onShare: () => void;
  onMenuToggle: () => void;
}

export default function TopBar({
  roomName,
  onRoomNameChange,
  users,
  status,
  onShare,
  onMenuToggle,
}: TopBarProps) {
  const [isEditingRoomName, setIsEditingRoomName] = useState(false);
  const [tempRoomName, setTempRoomName] = useState(roomName);

  // Sync tempRoomName when roomName changes externally
  useEffect(() => {
    if (!isEditingRoomName) {
      setTempRoomName(roomName);
    }
  }, [roomName, isEditingRoomName]);

  const handleRoomNameSubmit = () => {
    if (tempRoomName.trim()) {
      onRoomNameChange(tempRoomName.trim());
    }
    setIsEditingRoomName(false);
  };

  const handleRoomNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRoomNameSubmit();
    } else if (e.key === 'Escape') {
      setTempRoomName(roomName);
      setIsEditingRoomName(false);
    }
  };

  const getStatusDotClass = () => {
    switch (status) {
      case 'connected':
        return 'top-bar__status-dot--connected';
      case 'reconnecting':
        return 'top-bar__status-dot--reconnecting';
      default:
        return 'top-bar__status-dot--offline';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'connected':
        return 'Connected';
      case 'reconnecting':
        return 'Reconnecting...';
      default:
        return 'Offline';
    }
  };

  return (
    <div className="top-bar">
      <div className="top-bar__left">
        <button className="mobile-menu-btn" onClick={onMenuToggle} aria-label="Toggle menu">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M2 4h16M2 10h16M2 16h16" />
          </svg>
        </button>
        
        <a href="/" className="top-bar__logo">
          <div className="top-bar__logo-icon"></div>
          <span>CollabEditor</span>
        </a>

        <div className="top-bar__room-name">
          {isEditingRoomName ? (
            <input
              type="text"
              value={tempRoomName}
              onChange={(e) => setTempRoomName(e.target.value)}
              onBlur={handleRoomNameSubmit}
              onKeyDown={handleRoomNameKeyDown}
              autoFocus
            />
          ) : (
            <span
              onClick={() => {
                setTempRoomName(roomName);
                setIsEditingRoomName(true);
              }}
              style={{ cursor: 'pointer' }}
            >
              {roomName}
            </span>
          )}
        </div>

        <div className="top-bar__users-count">
          <span className="top-bar__users-count-dot"></span>
          <span>{users.length} Active</span>
        </div>
      </div>

      <div className="top-bar__right">
        <div className="top-bar__status">
          <span className={`top-bar__status-dot ${getStatusDotClass()}`}></span>
          <span>{getStatusText()}</span>
        </div>
        <button className="top-bar__share-btn" onClick={onShare}>
          Share
        </button>
      </div>
    </div>
  );
}
