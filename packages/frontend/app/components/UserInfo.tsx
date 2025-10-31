import { User } from "~/types";

interface UserInfoProps {
	user: User;
}

export function UserInfo({ user }: UserInfoProps) {
	return (
		<div className="flex items-center space-x-4">
			{user.avatar && (
				<img
					src={user.avatar}
					alt={`${user.name}'s avatar`}
					className="w-10 h-10 rounded-full"
				/>
			)}
			<div>
				<p className="font-medium">{user.name}</p>
				<p className="text-sm text-muted-foreground">{user.email}</p>
			</div>
		</div>
	);
}
