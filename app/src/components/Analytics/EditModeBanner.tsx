import { motion, AnimatePresence } from "framer-motion";

interface EditModeBannerProps {
  visible: boolean;
  className?: string;
}

export const EditModeBanner: React.FC<EditModeBannerProps> = ({
  visible,
  className = "",
}) => (
  <AnimatePresence>
    {visible && (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.2 }}
        className={className}
      >
        <div className="bg-gray-900 text-white text-sm px-4 py-4 items-center text-center rounded-2xl w-fit mx-auto">
          You're in edit mode. Use the chat to make changes, then click{" "}
          <span className="font-semibold">Save</span> in the toolbar to save
          them.
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);
