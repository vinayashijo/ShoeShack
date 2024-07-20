const userNameId = document.getElementById('typeNameX');
const passId = document.getElementById('typePW');
const mobileid = document.getElementById('typeMobileX');
const error1 = document.getElementById('error1');
const error3 = document.getElementById('otpresult');
const error4 = document.getElementById('error4');
const error5 = document.getElementById('error5');
const regform = document.getElementById('logform');

function passvalidate() {
  const passval = passId.value;
  const alpha = /[a-zA-Z]/;
  const digit = /\d/;


  if (passval.length < 8) {
    error4.style.display = 'block';
    error4.innerHTML = 'Must have at least 8 characters';
  } else if (!alpha.test(passval) || !digit.test(passval)) {
    error4.innerHTML = 'Should contain Numbers and Alphabets!!';
    error4.style.display = 'block';
  } else {
    error4.style.display = 'none';
    error4.innerHTML = '';
  }
}



function namevalidate() {
  const nameval = userNameId.value;
  const allowedCharacters = /^[a-zA-Z0-9_\-]+$/;
  if (!allowedCharacters.test(nameval)) {
    error1.innerHTML = 'Username can only contain letters, numbers, underscores, and hyphens.';
    error1.style.display = 'block';
  } else {
    error1.style.display = 'none';
    error1.innerHTML = '';
  }
}

function mobvalidate() {
  const mobval = mobileid.value;
  const startsWithGreater = /^[7-9]/; 
  const notAllSameDigits = /^(?!(\d)\1{9})/; 
  if (mobval.trim() === '') {
      error5.style.display = 'block';
      error5.innerHTML = 'Please Enter a valid Mobile Number.';
  } else if (mobval.length !== 10) {
      error5.style.display = 'block';
      error5.innerHTML = 'Please Enter exactly 10 digits.';
  } else if (!startsWithGreater.test(mobval)) {
      error5.style.display = 'block';
      error5.innerHTML = 'Mobile number must start with a digit greater than 6.';
  } else if (!notAllSameDigits.test(mobval)) {
      error5.style.display = 'block';
      error5.innerHTML = 'Mobile number cannot consist of the same digit repeated 10 times.';
  } else {
      error5.style.display = 'none';
      error5.innerHTML = '';
  }
}


passId.addEventListener('blur', passvalidate);
userNameId.addEventListener('blur', namevalidate);
mobileid.addEventListener('blur', mobvalidate);


regform.addEventListener('submit', function (e) {
 
  passvalidate();
  namevalidate();
  mobvalidate();

  console.log('After validation');

  if (error1.innerHTML || error4.innerHTML || error3.innerHTML || error5.innerHTML ) {
    console.log('Validation failed');
    e.preventDefault();

    Toastify({
      text: 'Please correct the errors in the form.',
      duration: 5000, // Duration in milliseconds
      gravity: 'top', // Position of the toast
      close: true // Whether to show a close button
    }).showToast();

    // const errorMessage = document.getElementById('errorMessage');
    // errorMessage.innerText = 'Please correct the errors in the form.';
    // errorMessage.style.color = 'red';
  } else {
    console.log('Validation passed');
    this.submit();
  }
});