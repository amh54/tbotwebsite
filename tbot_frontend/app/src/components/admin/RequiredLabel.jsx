const requiredLabelStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: "4px",
};

const requiredStarStyle = {
  color: "#8b949e",
};

function RequiredLabel({ children }) {
  return (
    <span style={requiredLabelStyle}>
      {children}
      <span style={requiredStarStyle}>*</span>
    </span>
  );
}

export default RequiredLabel;
