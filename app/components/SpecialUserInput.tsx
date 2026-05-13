// 1. Add this state at the top of your Header function
const [isMenuOpen, setIsMenuOpen] = React.useState(false);

// 2. Place the SourceMenu component at the very end of your Header return
return (
  <header>
    {/* ... your existing header content ... */}
    
    {/* The Button from Step 1 goes here */}
    
    {/* The Popup Window (SourceMenu) */}
    <SourceMenu 
      isOpen={isMenuOpen} 
      onClose={() => setIsMenuOpen(false)}
      onSelect={(type) => {
        setIsMenuOpen(false);
        // Add your analysis logic here
      }}
      langKey={langKey}
    />
  </header>
);