import React from 'react';

const Profile: React.FC = () => {
  const userRaw = localStorage.getItem('loggedInUser');
  const user = userRaw ? JSON.parse(userRaw) : null;

  if (!user) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold">Profile</h2>
        <p className="mt-2 text-slate-600">No user information available.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold">Profile</h2>
      <div className="mt-4 space-y-2">
        <div><span className="font-medium">Name:</span> {user.name}</div>
        <div><span className="font-medium">Email:</span> {user.email}</div>
      </div>
    </div>
  );
};

export default Profile;
