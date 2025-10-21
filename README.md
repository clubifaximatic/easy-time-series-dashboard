# Time Series Dashboard

A client-side web application for visualizing time-series data from CSV files. Upload CSV files to create interactive line charts with the ability to show/hide individual data series.

The web application is live and available for testing here: https://dev.elllimoner.com/easy-time-series-dashboard/

## Features

- **Drag & Drop Upload**: Easy CSV file upload with drag-and-drop support
- **Interactive Charts**: Powered by Chart.js with zoom, pan, and hover interactions
- **Sample Control**: Toggle visibility of individual data series
- **Real-time Processing**: All CSV processing happens in the browser
- **Responsive Design**: Modern Material Design interface that works on all devices
- **Data Validation**: Robust CSV parsing with error handling and validation

## CSV File Format

The application expects CSV files with the following structure:

```csv
Time,Sample1,Sample2,Sample3,...
0,value1,value2,value3,...
1,value1,value2,value3,...
2,value1,value2,value3,...
...
```

**Requirements:**
- First row: Column headers (first column should be time, subsequent columns are sample names)
- First column: Time values in one of the supported formats (see Time Formats section)
- Subsequent columns: Numeric sample values
- All values must be comma-separated
- Missing values are handled gracefully

## Time Formats

The dashboard supports multiple time formats in the first column:

### 1. Integer Values (0, 1, 2, ...)
Simple sequential integer values starting with 0 or 1
```csv
Time,Sample1,Sample2
0,10.5,20.1
1,11.2,21.3
2,12.0,22.5
```
**Display:** Shows as integer numeric values on the chart

### 2. Epoch Seconds (e.g., 1760784150)
Unix timestamp in seconds (10-12 digits)
```csv
Time,Sample1,Sample2
1760784150,10.5,20.1
1760784151,11.2,21.3
1760784152,12.0,22.5
```
**Display:** Shows as HH:MM:SS with day separation

### 3. Epoch Milliseconds (e.g., 1760784150234)
Unix timestamp in milliseconds (13+ digits)
```csv
Time,Sample1,Sample2
1760784150234,10.5,20.1
1760784150734,11.2,21.3
1760784151234,12.0,22.5
```
**Display:** Shows as HH:MM:SS:mmm with day separation

### 4. DateTime String (e.g., 20251018134550)
Concatenated date-time format: YYYYMMDDHHMMSS
```csv
Time,Sample1,Sample2
20251018134550,10.5,20.1
20251018134551,11.2,21.3
20251018134552,12.0,22.5
```
**Display:** Shows as HH:MM:SS with day separation

## File Structure

```
├── index.html                    # Main entry point
├── css/
│   └── styles.css               # Modern Material Design styles
├── js/
│   └── dashboard.js             # Main application logic
├── sample-data.csv              # Example CSV (integer time format)
├── sample-epoch-seconds.csv     # Example CSV (epoch seconds format)
├── sample-epoch-milliseconds.csv # Example CSV (epoch milliseconds format)
├── sample-datetime-string.csv   # Example CSV (datetime string format)
├── README.md                    # This file
└── CLAUDE.md                   # Project specifications
```

## Getting Started

1. **Open the Application**: Simply open `index.html` in a web browser
2. **Upload CSV Data**:
   - Click "Choose File" or drag and drop a CSV file
   - Use any of the sample CSV files to test different time formats:
     - `sample-data.csv` (integer time format)
     - `sample-epoch-seconds.csv` (epoch seconds format)
     - `sample-epoch-milliseconds.csv` (epoch milliseconds format)
     - `sample-datetime-string.csv` (datetime string format)
3. **Interact with Data**:
   - Toggle sample visibility using the switches
   - Hover over data points for detailed values
   - Use Chart.js built-in zoom and pan features

## Sample Data

The included `sample-data.csv` contains sensor data with the following samples:
- **Temperature**: Temperature readings over time
- **Humidity**: Humidity percentage readings
- **Pressure**: Atmospheric pressure readings
- **CPU_Usage**: CPU utilization percentage

## Technical Details

### Dependencies
- **Chart.js**: Used for rendering interactive line charts
- **Date-fns**: Utility library for date formatting (if needed)

### Browser Compatibility
- Modern browsers with ES6+ support
- File API support for CSV upload
- Canvas support for Chart.js

### Data Processing
- Client-side CSV parsing with validation
- Automatic data type detection and conversion
- Error handling for malformed data
- Memory-efficient processing for large datasets

## Customization

### Adding New Chart Types
Modify the Chart.js configuration in `dashboard.js` to support different visualization types:

```javascript
// Change chart type in renderChart() method
type: 'line', // Can be 'bar', 'scatter', etc.
```

### Color Themes
Update the color palette in the `getColorForSample()` method:

```javascript
const colors = [
    // Add your custom colors here
    'rgba(255, 99, 132, 1)',
    'rgba(54, 162, 235, 1)',
    // ...
];
```

### Styling
Customize the appearance by modifying `css/styles.css`. The design uses CSS Grid and Flexbox for responsive layouts.

## Troubleshooting

### Common Issues

1. **CSV not loading**: Ensure the file has the correct format with comma separators
2. **No data visible**: Check that at least one sample toggle is enabled
3. **Chart not rendering**: Verify that Chart.js is loaded properly
4. **Performance issues**: Large CSV files (>10MB) may cause slowness

### Browser Console
Open browser developer tools to see detailed error messages and debugging information.

## Development

To extend the application:

1. **Add new features** to the `TimeSeriesDashboard` class in `js/dashboard.js`
2. **Update styling** in `css/styles.css`
3. **Modify HTML structure** in `index.html` as needed

The application follows a modular design with clear separation of concerns:
- HTML for structure
- CSS for presentation
- JavaScript for behavior and data processing

## License

This project is provided as-is for educational and demonstration purposes.
