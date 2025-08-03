import { motion } from 'motion/react';

export const PageAnimation = ({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) => {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: 'easeInOut', delay: 0.1 }}
    >
      {children}
    </motion.div>
  );
};
interface NavItemMotionWrapperProps {
  description?: string;
  name: string;
  isActive: boolean;
}

export const NavItemMotionWrapper: React.FC<NavItemMotionWrapperProps> = ({
  description,
  name,
  isActive,
}) => (
  <motion.p
    key={`desc-${name}-${isActive}`}
    initial={{ opacity: 0, height: 0 }}
    animate={{ opacity: 1, height: 'auto' }}
    exit={{ opacity: 0, height: 0 }}
    transition={{ duration: 0.2 }}
    className="text-sm mt-1  text-sidebar-accent-foreground/50"
  >
    {description}
  </motion.p>
);
// {<p
// 		key={name}
// 		className={cn(
// 			"text-sm mt-1 text-sidebar-accent-foreground/50 transition-all duration-200 overflow-hidden",
// 			isActive ? "opacity-100 max-h-40" : "opacity-0 max-h-0"
// 		)}
// 	>
// 		{description}
// 	</p>
// 	 <motion.p
// 	key={`desc-${name}`}
// 	initial={{ opacity: 0, height: 0 }}
// 	animate={{ opacity: 1, height: "auto" }}
// 	exit={{ opacity: 0, height: 0 }}
// 	transition={{ duration: 0.2 }}
// 	className="text-sm mt-1  text-sidebar-accent-foreground/50"
// >
// 	{description}
// </motion.p>;
// }
