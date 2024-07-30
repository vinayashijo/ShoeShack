let cropper;
const hidden= document.getElementById('hiddenContainer');
const fileInput = document.getElementById('fileInput');
const imageContainer = document.getElementById('imageContainer');
const cropButton = document.getElementById('cropButton');
const cropModal = document.getElementById('cropModal');
const image = document.getElementById('image');
const preview = document.getElementById('croppedImages');
let index;


alert(fileInput)
// Image selection and display logic
fileInput.addEventListener('change', (event) => {
    const files = event.target.files;
    imageContainer.innerHTML = ''; // Clear previous images
    Array.from(files).forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const imgItem = document.createElement('div');
            imgItem.className = 'col-md-3 image-item';
            imgItem.innerHTML = `
                <div class="row">
                <div class="col-3">
                <img src="${e.target.result}" alt="Image ${index + 1}">
                </div>
                <div class="col-3">   
                <button class="btn btn-sm btn-primary m-2 showButton" data-index="${index}">Show</button>
                </div>
                </div>
            `;
            imageContainer.appendChild(imgItem);
        };
        reader.readAsDataURL(file);
    });
});

// Modal display logic
imageContainer.addEventListener('click', (event) => {
    event.preventDefault();
    if (event.target.classList.contains('showButton')) {
        index = event.target.getAttribute('data-index');
        const file = fileInput.files[index];
        const reader = new FileReader();
        reader.onload = (e) => {
            image.src = e.target.result;
            $('#cropModal').modal('show');
            if (cropper) {
                cropper.destroy();
            }
            cropper = new Cropper(image, {
                aspectRatio: 1,
                viewMode: 1,
            });
        };
        reader.readAsDataURL(file);
    }
});

// Cropping logic
cropButton.addEventListener('click', async () => {
    const croppedCanvas = cropper.getCroppedCanvas();
    const croppedImage = croppedCanvas.toDataURL('image/png');
// display cropped Image  
    const imgElement = document.createElement('img');
    imgElement.src = croppedImage;
    imgElement.className = 'img-thumbnail';
    const imgWrapper = document.createElement('div');
    imgWrapper.className = 'col-md-3';
    imgWrapper.appendChild(imgElement);
    preview.appendChild(imgWrapper);
// Extract dimensions.
    let dimension = cropper.getData();
    const delimiter = '|';
    const values = [ index,dimension.x , dimension.y , dimension.height , dimension.width ];
    const imageData = values.join(delimiter);
    console.log("Values = ",imageData);
    createHiddenInput(index,imageData,hidden);
    $('#cropModal').modal('hide');
    cropper.destroy();
});
// Create hidden input field for storing cropped coordinates !!
function createHiddenInput(index,data,parent){
     const input = document.createElement('input');
     console.log("INdex value ::"+index);
     input.type ='hidden';
     input.name ='cropImage'+index;
     input.value = data;
     console.log("Hidden Field"+input.value+input.name)
     parent.appendChild(input);
}
// Ensure modal close button works
$('.modal').on('hidden.bs.modal', function () {
    if (cropper) {
        cropper.destroy();
    }
});   //cropper js