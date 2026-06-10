import React from 'react';

export default function NoticeBoard() {
  const notices = [
    { id: 1, title: 'System Update', content: 'Maintenance at midnight.' },
    { id: 2, title: 'New Feature', content: 'We just launched the HR module.' }
  ];

  return (
    <div className="p-4 border rounded-md shadow-sm">
      <h2 className="text-xl font-bold mb-4">Notice Board</h2>
      <ul className="space-y-2">
        {notices.map(notice => (
          <li key={notice.id} className="p-2 border-b last:border-0">
            <h3 className="font-semibold">{notice.title}</h3>
            <p className="text-gray-600">{notice.content}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
