# WarRoomModal Usage

The WarRoomModal component provides a tactical command interface for creating and managing campaigns.

## Features

- **Full-screen modal** with tactical command aesthetic
- **Terminal log** with typewriter effect showing system processing
- **Campaign blueprint display** with milestones and scheduling
- **Integration with backend APIs** for campaign strategizing and confirmation

## Usage

### Basic Usage

```jsx
import WarRoomModal from './components/overlays/WarRoomModal';

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);
  
  const handleCampaignCreated = (response) => {
    console.log('Campaign created:', response);
    // Handle the created campaign and scheduled tasks
  };

  return (
    <WarRoomModal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      goal="Learn Advanced Web Development"
      availableHours={6}
      onCampaignCreated={handleCampaignCreated}
    />
  );
}
```

### Triggering the Modal

You can trigger the modal in several ways:

1. **Button Click** (as shown in WelcomeMessage):
```jsx
<button onClick={() => onOpenWarRoom("Your Goal Here", 4)}>
  Open Strategic Planning
</button>
```

2. **Programmatically**:
```jsx
const openWarRoom = (goal, hours = 4) => {
  setWarRoomGoal(goal);
  setWarRoomHours(hours);
  setIsWarRoomOpen(true);
};
```

## API Integration

The modal automatically calls two backend endpoints:

1. **POST /campaign/strategize** - Generates campaign plan
2. **POST /campaign/confirm** - Saves campaign and schedules tasks

## Styling

The modal uses:
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Glassmorphism effects** with backdrop blur
- **Matrix-style colors** (greens, golds, deep blacks)

## Customization

You can customize:
- Terminal log messages (fakeLogs array)
- Color scheme via CSS classes
- Animation timing and effects
- Default available hours

## Example Integration

See `App.jsx` for a complete integration example including:
- State management
- Error handling
- Task integration
- Audio feedback
