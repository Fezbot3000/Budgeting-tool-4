// Modal and page elements
const entryModal = document.getElementById('entryModal');
const addEntryButton = document.getElementById('addEntryButton');
const doneButton = document.getElementById('doneButton');
const imageUpload = document.getElementById('imageUpload');
const imageGrid = document.querySelector('.image-grid');
const journalEntries = document.getElementById('journalEntries');
const journalText = document.getElementById('journalText');
const modalThreeDotMenu = document.getElementById('modalThreeDotMenu');
const homeThreeDotMenu = document.getElementById('homeThreeDotMenu');
const entryDateElement = document.getElementById('entryDate');
const modalMenuButton = document.getElementById('modalMenuButton');
const customDatePickerModal = document.getElementById('customDatePickerModal');
const datePickerInput = document.getElementById('datePickerInput');
const confirmDateButton = document.getElementById('confirmDate');
const cancelDateButton = document.getElementById('cancelDate');
const imageModal = document.getElementById('imageModal');
const imageModalContent = document.getElementById('imageModalContent');
const imageDetails = document.getElementById('imageDetails');
const removeImageButton = document.getElementById('removeImageButton');
let selectedEntry = null;
let currentMode = 'view'; // Track the current mode: view, create, edit
let currentImageIndex = 0;
let currentImages = [];
let imageMetadata = new Map();  // Store image metadata

// Utility function to get today's date in a readable format
function getFormattedDate() {
    const date = new Date();
    return date.toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
}

// Switch modes: 'view', 'create', 'edit'
function switchMode(mode) {
    currentMode = mode;

    if (currentMode === 'view') {
        removeImageButton.style.display = 'none'; // Hide remove button in view mode
    } else if (currentMode === 'edit' || currentMode === 'create') {
        removeImageButton.style.display = 'block'; // Show remove button in create/edit mode
    }
}

// Open modal when plus icon is clicked (for new entry)
addEntryButton.addEventListener('click', function () {
    switchMode('create'); // Switch to create mode
    entryModal.style.display = 'flex';
    journalText.value = '';
    imageGrid.innerHTML = '';
    currentImages = []; // Clear the current images
    entryDateElement.textContent = getFormattedDate();
    document.getElementById('modalEntryDate').textContent = `Entry Date: ${getFormattedDate()}`;
});

// Add images to grid when uploaded (multiple images allowed)
imageUpload.addEventListener('change', function (event) {
    const files = event.target.files;

    Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = function (e) {
            const imgElement = document.createElement('img');
            imgElement.src = e.target.result;
            imgElement.style.cursor = 'pointer'; // Pointer cursor on hover
            imgElement.addEventListener('click', function () {
                openImageModal(imgElement.src, file); // Open modal with correct file
            });
            imageGrid.appendChild(imgElement);
            currentImages.push(imgElement); // Add to image list for cycling
        };
        reader.readAsDataURL(file);
    });
});

// Open full-size image modal with EXIF metadata or previously saved metadata
function openImageModal(src, file = null) {
    imageModal.style.display = 'flex';
    imageModalContent.src = src;

    // Set current image index for navigation
    currentImageIndex = currentImages.findIndex(img => img.src === src);

    // Show the remove button based on the mode
    if (currentMode === 'create' || currentMode === 'edit') {
        removeImageButton.style.display = 'block';
    } else {
        removeImageButton.style.display = 'none';
    }

    if (file) {
        // Extract and display EXIF metadata if file is provided
        EXIF.getData(file, function () {
            const dateTaken = EXIF.getTag(this, 'DateTimeOriginal');
            const lat = EXIF.getTag(this, 'GPSLatitude');
            const lon = EXIF.getTag(this, 'GPSLongitude');
            const metadata = {
                dateTaken: dateTaken || 'N/A',
                location: lat && lon ? `${lat}, ${lon}` : 'N/A'
            };

            // Store metadata for this image
            imageMetadata.set(src, metadata);

            imageDetails.textContent = `Date Taken: ${metadata.dateTaken} | Location: ${metadata.location}`;
        });
    } else {
        // Retrieve previously stored metadata if no file is passed
        const metadata = imageMetadata.get(src);
        if (metadata) {
            imageDetails.textContent = `Date Taken: ${metadata.dateTaken} | Location: ${metadata.location}`;
        } else {
            imageDetails.textContent = 'No metadata available';
        }
    }

    // Ensure metadata is always positioned at the bottom
    imageDetails.style.position = 'absolute';
    imageDetails.style.bottom = '10px';
    imageDetails.style.left = '10px';
}

// Close full-size image modal
document.getElementById('closeImageModal').addEventListener('click', function () {
    imageModal.style.display = 'none';
});

// Remove image from the modal and grid
removeImageButton.addEventListener('click', function () {
    const imageToRemove = currentImages[currentImageIndex];
    imageToRemove.remove(); // Remove the image from the grid
    currentImages.splice(currentImageIndex, 1); // Remove from the array
    imageModal.style.display = 'none'; // Close modal after removing
    removeImageButton.style.display = 'none'; // Hide remove button after removing
});

// Cycle through images (previous and next)
function cycleImages(direction) {
    if (direction === 'next') {
        currentImageIndex = (currentImageIndex + 1) % currentImages.length;
    } else if (direction === 'prev') {
        currentImageIndex = (currentImageIndex - 1 + currentImages.length) % currentImages.length;
    }
    imageModalContent.src = currentImages[currentImageIndex].src;
}

// Add event listeners for left and right arrows
document.addEventListener('keydown', function (event) {
    if (event.key === 'ArrowRight') {
        cycleImages('next');
    } else if (event.key === 'ArrowLeft') {
        cycleImages('prev');
    }
});

// Sort journal entries by date
function sortJournalEntries() {
    const entries = Array.from(document.querySelectorAll('.journal-entry'));

    entries.sort((a, b) => {
        const dateA = new Date(a.querySelector('.date').textContent);
        const dateB = new Date(b.querySelector('.date').textContent);
        return dateB - dateA;
    });

    entries.forEach(entry => journalEntries.appendChild(entry));
}

// Save journal entry when Done button is clicked
doneButton.addEventListener('click', function () {
    if (currentMode === 'edit' && selectedEntry) {
        // Edit the existing entry
        const entryImagesDiv = selectedEntry.querySelector('.entry-images');
        const entryTextElement = selectedEntry.querySelector('.journal-text');
        const entryDateElementOnPage = selectedEntry.querySelector('.date');

        entryImagesDiv.innerHTML = '';
        imageGrid.querySelectorAll('img').forEach(img => {
            const imgClone = img.cloneNode(true);
            imgClone.style.cursor = 'pointer'; // Add pointer cursor on hover
            imgClone.addEventListener('click', function () {
                openImageModal(imgClone.src, null); // Open modal on click
            });
            entryImagesDiv.appendChild(imgClone);
            currentImages.push(imgClone); // Add cloned image to currentImages for modal cycling
        });

        entryTextElement.innerHTML = journalText.value.replace(/\n/g, '<br>');
        entryDateElementOnPage.textContent = entryDateElement.textContent;

        sortJournalEntries();

    } else {
        // Create a new entry
        const entryDiv = document.createElement('div');
        entryDiv.classList.add('journal-entry');

        const entryImagesDiv = document.createElement('div');
        entryImagesDiv.classList.add('entry-images');
        imageGrid.querySelectorAll('img').forEach(img => {
            const imgClone = img.cloneNode(true);
            imgClone.style.cursor = 'pointer'; // Add pointer cursor on hover
            imgClone.addEventListener('click', function () {
                openImageModal(imgClone.src, null); // Open modal on click
            });
            entryImagesDiv.appendChild(imgClone);
            currentImages.push(imgClone); // Add cloned image to currentImages for modal cycling
        });
        entryDiv.appendChild(entryImagesDiv);

        const entryText = document.createElement('p');
        entryText.classList.add('journal-text');
        entryText.innerHTML = journalText.value.replace(/\n/g, '<br>');
        entryDiv.appendChild(entryText);

        const entryDate = document.createElement('p');
        entryDate.classList.add('date');
        entryDate.textContent = entryDateElement.textContent;
        entryDiv.appendChild(entryDate);

        const threeDots = document.createElement('span');
        threeDots.textContent = '⋮';
        threeDots.classList.add('three-dots');
        threeDots.addEventListener('click', function (event) {
            selectedEntry = entryDiv;
            const rect = event.target.getBoundingClientRect();
            const menuWidth = homeThreeDotMenu.offsetWidth;
            const viewportWidth = window.innerWidth;

            // Set initial left position
            let leftPosition = rect.left;

            // If the menu will overflow the screen, adjust position to the left
            if ((leftPosition + menuWidth) > viewportWidth) {
                leftPosition = viewportWidth - menuWidth - 20; // 20px padding from the right edge
            }

            // Positioning for vertical and horizontal based on screen space
            homeThreeDotMenu.style.left = `${leftPosition}px`;
            homeThreeDotMenu.style.top = `${rect.top + rect.height + 5}px`; // 5px gap below the three dots
            homeThreeDotMenu.style.display = 'block';
        });

        entryDiv.appendChild(threeDots);

        journalEntries.appendChild(entryDiv);

        sortJournalEntries();
    }

    journalText.value = '';
    imageGrid.innerHTML = '';
    currentImages = []; // Clear images
    switchMode('view'); // Switch back to view mode
    entryModal.style.display = 'none';
});

// Modal menu button interaction (in the modal)
modalMenuButton.addEventListener('click', function (event) {
    const rect = modalMenuButton.getBoundingClientRect();
    modalThreeDotMenu.style.left = `${rect.left}px`;
    modalThreeDotMenu.style.top = `${rect.bottom}px`;
    modalThreeDotMenu.style.zIndex = '1100';
    modalThreeDotMenu.style.display = 'block';
});

// Hide the modal three-dot menu if clicking outside of it
document.addEventListener('click', function (event) {
    if (!event.target.matches('#modalMenuButton') && !event.target.closest('.three-dot-menu')) {
        modalThreeDotMenu.style.display = 'none';
    }
});

// Open the custom date picker modal
document.getElementById('modalCustomDate').addEventListener('click', function () {
    customDatePickerModal.style.display = 'flex';
});

// Confirm custom date and close the date picker modal
confirmDateButton.addEventListener('click', function () {
    const selectedDate = new Date(datePickerInput.value).toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });

    entryDateElement.textContent = selectedDate;
    document.getElementById('modalEntryDate').textContent = `Entry Date: ${selectedDate}`;
    customDatePickerModal.style.display = 'none';
});

// Cancel custom date picker
cancelDateButton.addEventListener('click', function () {
    customDatePickerModal.style.display = 'none';
});

// Delete an entry from the modal
document.getElementById('modalDeleteEntry').addEventListener('click', function () {
    if (confirm('Are you sure you want to delete this entry?')) {
        if (currentMode === 'edit' && selectedEntry) {
            selectedEntry.remove();
        }
        entryModal.style.display = 'none';
        journalText.value = '';
        imageGrid.innerHTML = '';
        modalThreeDotMenu.style.display = 'none';
    }
});

// Hide the home three-dot menu if clicking outside of it
document.addEventListener('click', function (event) {
    if (!event.target.matches('.three-dots') && !event.target.closest('.three-dot-menu')) {
        homeThreeDotMenu.style.display = 'none';
    }
});

// Home edit entry button
document.getElementById('homeEditEntry').addEventListener('click', function () {
    const entryImages = selectedEntry.querySelectorAll('.entry-images img');
    const entryText = selectedEntry.querySelector('.journal-text').innerHTML;

    journalText.value = entryText.replace(/<br\s*\/?>/g, '\n');
    imageGrid.innerHTML = '';
    currentImages = []; // Clear previous images before editing

    entryImages.forEach(img => {
        const imgClone = img.cloneNode(true);
        imgClone.style.cursor = 'pointer'; // Add pointer cursor on hover
        imgClone.addEventListener('click', function () {
            openImageModal(imgClone.src, null); // Open modal on click
        });
        imageGrid.appendChild(imgClone);
        currentImages.push(imgClone); // Add cloned image to currentImages for modal cycling
    });

    switchMode('edit');
    entryModal.style.display = 'flex';

    homeThreeDotMenu.style.display = 'none';
});

// Bookmark functionality
document.getElementById('homeBookmarkEntry').addEventListener('click', function () {
    selectedEntry.classList.toggle('bookmarked');
    homeThreeDotMenu.style.display = 'none';
});

// Delete an entry from the home three-dot menu
document.getElementById('homeDeleteEntry').addEventListener('click', function () {
    if (confirm('Are you sure you want to delete this entry?')) {
        selectedEntry.remove();
        homeThreeDotMenu.style.display = 'none';
    }
});
