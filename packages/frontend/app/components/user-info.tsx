import { useAuth } from "../wrapper/auth-provider";

export function UserInfo() {
  const { session, isPending, error, signOut } = useAuth();

  if (isPending) return <div>Loading user...</div>;
  if (error) return <div>Error loading user</div>;
  if (!session) return <div>Not logged in</div>;

  // For better-auth, session contains user data in session.user
  const userData = session?.user;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      {userData?.image && (
        <img 
          src={userData.image} 
          alt={userData.name || userData.email} 
          style={{ width: 32, height: 32, borderRadius: "50%" }} 
        />
      )}
      <span>{userData?.name || userData?.email || "User"}</span>
      <button
        style={{ marginLeft: 8, padding: "4px 12px", borderRadius: 4, border: "1px solid #ccc", background: "#fff", cursor: "pointer" }}
        onClick={async () => {
          await signOut();
          window.location.href = "/";
        }}
      >
        Logout
      </button>
    </div>
  );
}