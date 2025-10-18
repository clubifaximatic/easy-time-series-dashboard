/**
 * Time Series Dashboard
 * Client-side CSV processing and visualization
 */

class TimeSeriesDashboard {
    constructor() {
        this.csvData = null;
        this.parsedData = null;
        this.chart = null;
        this.visibleSamples = new Set();
        this.timeFormat = null;

        this.initializeEventListeners();
    }

    initializeEventListeners() {
        const fileInput = document.getElementById('csvFile');
        const uploadArea = document.getElementById('uploadArea');

        // File input change event
        fileInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                this.handleFileUpload(file);
            }
        });

        // Drag and drop events
        uploadArea.addEventListener('dragover', (event) => {
            event.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (event) => {
            event.preventDefault();
            uploadArea.classList.remove('dragover');

            const files = event.dataTransfer.files;
            if (files.length > 0 && files[0].type === 'text/csv') {
                this.handleFileUpload(files[0]);
            }
        });

        // Click to upload
        uploadArea.addEventListener('click', () => {
            fileInput.click();
        });
    }

    async handleFileUpload(file) {
        try {
            this.showMessage('Loading CSV file...', 'info');

            const text = await this.readFileAsText(file);
            this.parsedData = this.parseCSV(text);

            if (this.parsedData && this.parsedData.samples.length > 0) {
                this.showMessage(`Successfully loaded ${this.parsedData.samples.length} samples with ${this.parsedData.timePoints.length} data points`, 'success');
                this.renderDashboard();
            } else {
                throw new Error('No valid data found in CSV file');
            }
        } catch (error) {
            this.showMessage(`Error loading file: ${error.message}`, 'error');
        }
    }

    readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => resolve(event.target.result);
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }

    parseCSV(csvText) {
        const lines = csvText.trim().split('\n');

        if (lines.length < 2) {
            throw new Error('CSV file must have at least 2 rows (header + data)');
        }

        // Parse header (sample names)
        const header = lines[0].split(',').map(col => col.trim());
        const timeColumnName = header[0];
        const sampleNames = header.slice(1);

        if (sampleNames.length === 0) {
            throw new Error('No sample columns found in CSV');
        }

        // Detect time format from first data row
        const firstDataRow = lines[1].split(',').map(val => val.trim());
        this.timeFormat = this.detectTimeFormat(firstDataRow[0]);

        // Parse data rows
        const timePoints = [];
        const processedTimePoints = [];
        const sampleData = {};

        // Initialize sample data arrays
        sampleNames.forEach(name => {
            sampleData[name] = [];
        });

        // Process each data row
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(val => val.trim());

            if (values.length !== header.length) {
                console.warn(`Row ${i + 1} has ${values.length} values, expected ${header.length}`);
                continue;
            }

            const rawTimeValue = values[0];
            const processedTime = this.processTimeValue(rawTimeValue, this.timeFormat);

            if (processedTime === null) {
                console.warn(`Invalid time value at row ${i + 1}: ${rawTimeValue}`);
                continue;
            }

            timePoints.push(processedTime.numeric);
            processedTimePoints.push(processedTime);

            // Parse sample values
            for (let j = 1; j < values.length; j++) {
                const sampleName = sampleNames[j - 1];
                const value = parseFloat(values[j]);

                if (isNaN(value)) {
                    console.warn(`Invalid value for sample ${sampleName} at row ${i + 1}: ${values[j]}`);
                    sampleData[sampleName].push(null);
                } else {
                    sampleData[sampleName].push(value);
                }
            }
        }

        // Validate data
        if (timePoints.length === 0) {
            throw new Error('No valid data rows found');
        }

        return {
            timeColumnName,
            samples: sampleNames,
            timePoints,
            processedTimePoints,
            sampleData,
            timeFormat: this.timeFormat
        };
    }

    detectTimeFormat(timeValue) {
        const trimmedValue = timeValue.trim();

        // Integer values starting with 0 or 1
        if (/^[01]\d*$/.test(trimmedValue) && trimmedValue.length <= 10) {
            return 'integer';
        }

        // Time string format (YYYYMMDDHHMMSS)
        if (/^\d{14}$/.test(trimmedValue)) {
            return 'datetime_string';
        }

        // Epoch in milliseconds (13+ digits)
        if (/^\d{13,}$/.test(trimmedValue)) {
            return 'epoch_milliseconds';
        }

        // Epoch in seconds (10+ digits, but less than 13)
        if (/^\d{10,12}$/.test(trimmedValue)) {
            return 'epoch_seconds';
        }

        // Default to integer if it's a number
        if (!isNaN(parseFloat(trimmedValue))) {
            return 'integer';
        }

        throw new Error(`Unrecognized time format: ${timeValue}`);
    }

    processTimeValue(rawValue, format) {
        const trimmedValue = rawValue.trim();

        try {
            switch (format) {
                case 'integer':
                    const intValue = parseInt(trimmedValue);
                    return {
                        numeric: intValue,
                        display: intValue.toString(),
                        raw: rawValue
                    };

                case 'epoch_seconds':
                    const epochSeconds = parseInt(trimmedValue);
                    const dateFromSeconds = new Date(epochSeconds * 1000);
                    return {
                        numeric: dateFromSeconds.time(),
                        date: dateFromSeconds,
                        display: this.formatDateTime(dateFromSeconds),
                        raw: rawValue
                    };

                case 'epoch_milliseconds':
                    const epochMs = parseInt(trimmedValue);
                    const dateFromMs = new Date(epochMs);
                    return {
                        numeric: dateFromMs.getTime(),
                        date: dateFromMs,
                        display: this.formatDateTimeWithMs(dateFromMs),
                        raw: rawValue
                    };

                case 'datetime_string':
                    const dateFromString = this.parseDateTimeString(trimmedValue);
                    return {
                        numeric: dateFromString.getTime(),
                        date: dateFromString,
                        display: this.formatDateTime(dateFromString),
                        raw: rawValue
                    };

                default:
                    return null;
            }
        } catch (error) {
            console.warn(`Error processing time value ${rawValue}:`, error);
            return null;
        }
    }

    // ie 20251016082920 -> 2025 - 10 - 16 - 08 - 29 - 20
    parseDateTimeString(dateTimeStr) {
        // Parse YYYYMMDDHHMMSS format
        if (dateTimeStr.length !== 14) {
            throw new Error('DateTime string must be 14 characters (YYYYMMDDHHMMSS)');
        }

        const year = parseInt(dateTimeStr.substr(0, 4));
        const month = parseInt(dateTimeStr.substr(4, 2))
        const day = parseInt(dateTimeStr.substr(6, 2));
        const hour = parseInt(dateTimeStr.substr(8, 2));
        const minute = parseInt(dateTimeStr.substr(10, 2));
        const second = parseInt(dateTimeStr.substr(12, 2));

        return new Date(year, month, day, hour, minute, second);
    }

    formatShortDateTime(date, withMillis = false) {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');

        var time = `${hours}:${minutes}:${seconds}`
        
        return  withMillis 
                    ? `${time}.${date.getMilliseconds().toString().padStart(3, '0')}` 
                    : time;
    }


    formatDateTime(date, withMillis = false) {
        const year = date.getFullYear().toString() 
        const month = date.getMonth().toString().padStart(2, '0')
        const day = date.getDate().toString().padStart(2, '0');
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');

        //if (days > 0) {
        //    return `${day} ${hours}:${minutes}:${seconds}`;
        //} else {
        //    return `${hours}:${minutes}:${seconds}`;
        //}
        var dateTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
        
        return  withMillis 
                    ? `${dateTime}.${date.getMilliseconds().toString().padStart(3, '0')}` 
                    : dateTime;
    }

    formatDateTimeWithMs(date) {
        formatDateTime(date, true);
    }

    renderDashboard() {
        // Show dashboard sections
        document.getElementById('controlsSection').style.display = 'block';
        document.getElementById('chartSection').style.display = 'block';
        document.getElementById('infoSection').style.display = 'block';

        // Initialize all samples as visible
        this.visibleSamples = new Set(this.parsedData.samples);

        // Render sample controls
        this.renderSampleControls();

        // Render chart
        this.renderChart();

        // Update info section
        this.updateInfoSection();
    }

    renderSampleControls() {
        const container = document.getElementById('sampleToggles');
        container.innerHTML = '';

        this.parsedData.samples.forEach((sampleName, index) => {
            const toggleDiv = document.createElement('div');
            toggleDiv.className = 'sample-toggle';

            const color = this.getColorForSample(index);

            toggleDiv.innerHTML = `
                <span class="sample-label" style="color: ${color};">
                    <span style="display: inline-block; width: 12px; height: 12px; background: ${color}; border-radius: 50%; margin-right: 8px;"></span>
                    ${sampleName}
                </span>
                <label class="toggle-switch">
                    <input type="checkbox" checked onchange="dashboard.toggleSample('${sampleName}')">
                    <span class="slider"></span>
                </label>
            `;

            container.appendChild(toggleDiv);
        });
    }

    toggleSample(sampleName) {
        if (this.visibleSamples.has(sampleName)) {
            this.visibleSamples.delete(sampleName);
        } else {
            this.visibleSamples.add(sampleName);
        }

        this.updateChart();
    }

    renderChart() {
        const ctx = document.getElementById('timeSeriesChart').getContext('2d');

        // Destroy existing chart if it exists
        if (this.chart) {
            this.chart.destroy();
        }

        const datasets = this.parsedData.samples.map((sampleName, index) => {
            const data = this.parsedData.timePoints.map((time, i) => ({
                x: time,
                y: this.parsedData.sampleData[sampleName][i]
            }));

            return {
                label: sampleName,
                data: data,
                borderColor: this.getColorForSample(index),
                backgroundColor: this.getColorForSample(index, 0.1),
                borderWidth: 2,
                fill: false,
                pointRadius: 2,
                pointHoverRadius: 5,
                tension: 0.1,
                hidden: !this.visibleSamples.has(sampleName)
            };
        });

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Time Series Data',
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    },
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            title: (context) => {
                                const dataIndex = context[0].dataIndex;
                                if (this.parsedData.processedTimePoints && this.parsedData.processedTimePoints[dataIndex]) {
                                    return `Time: ${this.parsedData.processedTimePoints[dataIndex].display}`;
                                }
                                return `Time: ${context[0].parsed.x}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'linear',
                        display: true,
                        title: {
                            display: true,
                            text: this.getXAxisTitle()
                        },
                        ticks: {
                            callback: (value, index, twos, threes, fours) => {
                                if (this.parsedData.processedTimePoints && this.parsedData.timeFormat !== 'integer') {
                                    return this.formatShortDateTime(new Date(value))
                                }
                                return value;
                            }
                        }
                    },
                    y: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Value'
                        }
                    }
                }
            }
        });
    }

    updateChart() {
        if (!this.chart) return;

        // Update dataset visibility
        this.chart.data.datasets.forEach((dataset, index) => {
            const sampleName = this.parsedData.samples[index];
            dataset.hidden = !this.visibleSamples.has(sampleName);
        });

        this.chart.update();
    }

    updateInfoSection() {
        const totalDataPoints = this.parsedData.timePoints.length;
        let timeRangeText;

        if (this.parsedData.processedTimePoints && this.parsedData.processedTimePoints.length > 0) {
            const firstTime = this.parsedData.processedTimePoints[0];
            const lastTime = this.parsedData.processedTimePoints[this.parsedData.processedTimePoints.length - 1];
            timeRangeText = `${firstTime.display} - ${lastTime.display}`;
        } else {
            const minTime = Math.min(...this.parsedData.timePoints);
            const maxTime = Math.max(...this.parsedData.timePoints);
            timeRangeText = `${minTime} - ${maxTime}`;
        }

        document.getElementById('sampleCount').textContent = this.parsedData.samples.length;
        document.getElementById('dataPointCount').textContent = totalDataPoints.toLocaleString();
        document.getElementById('timeRange').textContent = timeRangeText;
    }

    getXAxisTitle() {
        switch (this.parsedData?.timeFormat) {
            case 'integer':
                return 'Time (integer values)';
            case 'epoch_seconds':
            case 'epoch_milliseconds':
            case 'datetime_string':
                return 'Time (HH:MM:SS)';
            default:
                return 'Time';
        }
    }

    getColorForSample(index, alpha = 1) {
        const colors = [
            `rgba(102, 126, 234, ${alpha})`,   // Blue
            `rgba(255, 99, 132, ${alpha})`,    // Red
            `rgba(54, 162, 235, ${alpha})`,    // Light Blue
            `rgba(255, 206, 86, ${alpha})`,    // Yellow
            `rgba(75, 192, 192, ${alpha})`,    // Teal
            `rgba(153, 102, 255, ${alpha})`,   // Purple
            `rgba(255, 159, 64, ${alpha})`,    // Orange
            `rgba(199, 199, 199, ${alpha})`,   // Grey
            `rgba(83, 102, 255, ${alpha})`,    // Indigo
            `rgba(255, 99, 255, ${alpha})`     // Pink
        ];

        return colors[index % colors.length];
    }

    showMessage(text, type = 'info') {
        // Remove existing messages
        const existingMessages = document.querySelectorAll('.message');
        existingMessages.forEach(msg => msg.remove());

        // Create new message
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = text;

        // Insert after upload section
        const uploadSection = document.querySelector('.upload-section');
        uploadSection.parentNode.insertBefore(messageDiv, uploadSection.nextSibling);

        // Auto-hide success messages after 5 seconds
        if (type === 'success') {
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.remove();
                }
            }, 5000);
        }
    }
}

// Initialize dashboard when DOM is loaded
let dashboard;
document.addEventListener('DOMContentLoaded', () => {
    dashboard = new TimeSeriesDashboard();
});