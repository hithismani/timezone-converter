# 🌍 Timezone Converter

A beautiful, intuitive timezone converter web application built with React and TypeScript. Convert times between timezones, visualize working hours overlap, and easily add events to your calendar.

![License](https://img.shields.io/badge/license-ISC-blue.svg)
![React](https://img.shields.io/badge/React-18.2.0-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.2.2-blue.svg)

## ✨ Features

### Core Functionality
- **Timezone Conversion**: Convert times between any two IANA timezones in real-time
- **Working Hours Visualization**: Interactive 24-hour timeline showing availability overlap between timezones
- **Calendar Integration**: Add converted events directly to Google Calendar, Apple Calendar, Outlook, Yahoo, and more
- **Natural Language Input**: (Chrome/Edge only) Parse natural language time expressions using built-in browser AI
- **URL Sharing**: Share timezone conversions via URL parameters

### User Experience
- **Interactive Timeline**: Click on any time segment to set the exact time
- **Visual Indicators**: See current time positions for both timezones on the availability timeline
- **Smart Time Display**: Shows day differences (previous/next day) when timezones span calendar days
- **Working Hours Presets**: Quick presets for Morning, Workday, Evening, and All Day
- **Persistent Settings**: Working hours and timezone preferences saved to localStorage
- **Responsive Design**: Works seamlessly on desktop and mobile devices

### Technical Features
- **Zero External Dependencies**: Uses only browser-native APIs (`Intl.DateTimeFormat`)
- **Accurate Timezone Handling**: Properly handles DST changes and timezone offsets
- **SEO Optimized**: Open Graph meta tags for social sharing
- **Accessible**: Keyboard navigation and screen reader friendly

## 🚀 How It Works

### Timezone Conversion
The application uses the browser's native `Intl.DateTimeFormat` API to accurately convert times between timezones. This ensures:
- Correct handling of Daylight Saving Time (DST) transitions
- Accurate timezone offset calculations
- Support for all IANA timezone identifiers

### State Management
- **Single Source of Truth**: The `inputInstant` (UTC Date object) serves as the canonical time reference
- **Derived Values**: All display values (formatted times, positions, conversions) are derived from `inputInstant`
- **Local Storage**: User preferences (working hours, timezone selections) persist across sessions

### Working Hours Visualization
- **96 Segments**: The timeline is divided into 96 segments (15-minute intervals)
- **Color Coding**: 
  - 🟢 Green: Both timezones are working
  - 🟡 Amber: From timezone working, no overlap
  - 🟠 Orange: To timezone working, no overlap
  - ⚪ Gray: Neither timezone working
- **Real-time Calculation**: Overlap windows are calculated dynamically based on working hours and timezone differences

### Calendar Integration
Uses the [add-to-calendar-button](https://github.com/add2cal/add-to-calendar-button) library to generate calendar events with:
- Timezone conversion summary in the description
- Correct timezone-aware start/end times
- Support for multiple calendar providers

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- pnpm 10.9.0+ (or npm/yarn)

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/timezonehelper.git
   cd timezonehelper
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Start development server**
   ```bash
   pnpm dev
   ```

4. **Build for production**
   ```bash
   pnpm build
   ```

5. **Preview production build**
   ```bash
   pnpm preview
   ```

## 🎯 Usage

### Basic Conversion
1. Enter a date and time in the "Date & Time" field
2. Select a "From" timezone
3. Select a "To" timezone
4. The converted time displays automatically in the result panel

### Working Hours Setup
1. Click the settings gear icon next to a timezone input
2. Set start and end times for working hours
3. Use presets (Morning, Workday, Evening, All Day) for quick setup
4. The timeline updates automatically to show availability overlap

### Timeline Interaction
- **Click any segment** on the timeline to set that time
- **View indicators**: Purple shows time in "From" timezone, gray shows time in "To" timezone
- **See overlap**: Green segments indicate times when both timezones are working

### Natural Language Input (Chrome/Edge only)
Enter natural language expressions like:
- "Next Monday 2pm in New York"
- "Tomorrow morning in London"
- Press Enter or click Parse to convert

### Calendar Integration
1. After setting up a conversion, scroll to the "Add to Calendar" section
2. Click the button to see calendar options
3. Select your preferred calendar provider
4. The event includes timezone conversion details in the description

### URL Sharing
The app automatically updates URL parameters:
- `?from=America/New_York&to=Europe/London&datetime=2024-01-15T14:30`
- Share this URL to let others see the same conversion

## 🛠️ Technologies Used

- **React 18.2.0**: UI framework
- **TypeScript 5.2.2**: Type safety and better developer experience
- **Vite 5.0.0**: Build tool and dev server
- **Tailwind CSS 4.1.16**: Utility-first CSS framework
- **Intl API**: Browser-native internationalization for timezone handling
- **add-to-calendar-button**: Calendar integration library

## 📁 Project Structure

```
timezonehelper/
├── index.html          # HTML entry point with meta tags
├── index.tsx           # Main React component
├── main.tsx            # React entry point
├── index.css           # Global styles
├── public/             # Static assets (OG images, etc.)
├── package.json        # Dependencies and scripts
├── tsconfig.json       # TypeScript configuration
├── vite.config.ts      # Vite configuration
└── tailwind.config.js  # Tailwind CSS configuration
```

## 🧪 Key Functions

### `parseLocalInputToDate(localValue, fromTz)`
Parses a local datetime string in a specific timezone and converts it to a UTC Date object. Uses binary search with `Intl.DateTimeFormat` to accurately handle DST transitions.

### `instantToLocalISO(instant, tz)`
Converts a UTC Date object to a local ISO string (YYYY-MM-DDTHH:MM) in a specific timezone.

### `buildSegments()`
Creates 96 segments (15-minute intervals) representing the selected date, calculating availability status for each segment based on working hours.

### `getLocalHourDecimal(instant, tz)`
Gets the local hour as a decimal value (e.g., 14.5 for 2:30 PM) in a specific timezone.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

### Development Guidelines
- Follow TypeScript best practices
- Use functional components and hooks
- Maintain accessibility standards
- Test across different browsers and devices
- Update documentation as needed

## 📝 License

This project is licensed under the ISC License.

## 🙏 Acknowledgments

- [add-to-calendar-button](https://github.com/add2cal/add-to-calendar-button) for calendar integration
- Browser vendors for the Intl API implementation

## 🐛 Known Limitations

- Natural language parsing requires Chrome/Edge with built-in AI support
- Some older browsers may not support all IANA timezones
- Calendar event descriptions may vary by provider

## 📞 Support

If you encounter any issues or have questions, please open an issue on GitHub.

---

Made with ❤️ for the global remote work community

