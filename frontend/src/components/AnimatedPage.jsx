import { motion } from "framer-motion";

const animations = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
  },
  exit: {
    opacity: 0,
  },
};

const AnimatedPage = ({ children, pageKey }) => {
  return (
    <motion.div
      key={pageKey}
      variants={animations}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{
        duration: 0.12,
        ease: "easeOut",
      }}
      style={{ willChange: "opacity" }}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedPage;
