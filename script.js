'use strict';

// // prettier-ignore
// const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');


//------------------------------------------------------
//LECTURE: 250. Managing Workout Data: Creating Classes
class Workout {
    id = (Date.now() + "").slice(-10);
    date = new Date();
    clicks = 0;

    //
    constructor(coords, distance, duration) {
        this.coords = coords; // [lat, lng]
        this.distance = distance; // in km
        this.duration = duration; // in min
    }

    _setDescription() {
        //
        // prettier-ignore
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}`;
    }

    click() {
        this.clicks++;
    }
}

class Running extends Workout {
    type = "running";
    //
    constructor(coords, distance, duration, cadence) {
        super(coords, distance, duration);
        this.cadence = cadence;
        // this.type = "running";
        this.calcPace();
        this._setDescription();
    }

    calcPace() {
        //min/km
        this.pace = this.duration / this.distance;
        return this.pace;
    }
}


class Cycling extends Workout {
    type = "cycling";
    //
    constructor(coords, distance, duration, elevationGain) {
        super(coords, distance, duration);
        this.elevationGain = elevationGain;
        // this.type = "cycling";
        this.calcSpeed();
        this._setDescription();
    }

    calcSpeed() {
        //km/h
        this.speed = this.distance / (this.duration / 60);
        return this.speed;
    }
}

// //Me: to test if our calsses are working
// const running1 = new Running([39, -12], 5.2, 24, 178);

// const cycling1 = new Cycling([39, -12], 27, 95, 523);
// console.log(running1, cycling1);

//////////////////////////////////////////
//APPLICATION ARCHITECTURE

// let mapEvent, map;
//-----------------------------------------------------
//LECTURE: 249. Refactoring for Project Architecture
class App {
    #map;
    #mapEvent;
    #mapZoomLevel = 13;
    #workouts = [];

    //
    constructor() {
        // Get user's position
        this._getPosition();
        
        // Get data of workouts from local storage
        this._getLocalStorageOfWorkouts();

        // Attach event handlers
        form.addEventListener("submit", this._createNewWorkout.bind(this));

        inputType.addEventListener("change", this._toggleElevationField);

        containerWorkouts.addEventListener("click", this._moveMapToPopupMarker.bind(this));
    }

    _getPosition() {
        if (navigator.geolocation)
            navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), function() {
                alert("Could not get your position");
            });
    }

    _loadMap(position) {
        //
        const { latitude } = position.coords;
        const { longitude } = position.coords;

        const coords = [latitude, longitude];

        // console.log(this);
        this.#map = L.map('map').setView(coords, this.#mapZoomLevel);
        //

        L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.#map);


        //Handling clicks on map
        this.#map.on("click", this._showForm.bind(this));
        //

        
        //Me: the answer of this is in question in Q&As of this lecture
        this.#workouts.forEach(workout => {
            // this._renderWorkoutListItem(workout);
            this._renderWorkoutMarker(workout);
        })
    }

    _showForm(mapEve) {
        //
        this.#mapEvent = mapEve;
        form.classList.remove("hidden");
        inputDistance.focus();
    }

    _hideForm() {
        inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value = "";

        form.style.display = "none";
        form.classList.add("hidden");
        setTimeout(() => form.style.display = "grid", 1000);
        // setTimeout(() => (form.style.display = "grid"), 1000);
    }

    _toggleElevationField() {
        //
        inputCadence.closest(".form__row").classList.toggle("form__row--hidden");
        inputElevation.closest(".form__row").classList.toggle("form__row--hidden");
    }

    
    _renderWorkoutMarker(workout) {
        //
        L.marker(workout.coords).addTo(this.#map)
            .bindPopup(L.popup({
                maxWidth: 250,
                minWidth: 100,
                autoClose: false,
                closeOnClick: false,
                className: `${workout.type}-popup`
            }))
            .setPopupContent(
                `${workout.type === "running" ? "🏃‍♂️" : "🚴‍♀️"} ${workout.description}`)
            .openPopup();
    }

    _renderWorkoutListItem(workout) {
        //
        let htmlWorkoutListItem = `
                <li class="workout workout--${workout.type}" data-id="${workout.id}">
                    <h2 class="workout__title">${workout.description}</h2>
                    <div class="workout__details">
                        <span class="workout__icon">${workout.type === "running" ? "🏃‍♂️" : "🚴‍♀️"}</span>
                        <span class="workout__value">${workout.distance}</span>
                        <span class="workout__unit">km</span>
                    </div>
                    <div class="workout__details">
                        <span class="workout__icon">⏱</span>
                        <span class="workout__value">${workout.duration}</span>
                        <span class="workout__unit">min</span>
                    </div>`;

        if (workout.type === "running") {
            //
            htmlWorkoutListItem += `
                        <div class="workout__details">
                            <span class="workout__icon">⚡️</span>
                            <span class="workout__value">${workout.pace.toFixed(1)}</span>
                            <span class="workout__unit">min/km</span>
                        </div>
                        <div class="workout__details">
                            <span class="workout__icon">🦶🏼</span>
                            <span class="workout__value">${workout.cadence}</span>
                            <span class="workout__unit">spm</span>
                        </div>
                    </li>`;
        }

        if (workout.type === "cycling") {
            htmlWorkoutListItem += `
                    <div class="workout__details">
                        <span class="workout__icon">⚡️</span>
                        <span class="workout__value">${workout.speed.toFixed(1)}</span>
                        <span class="workout__unit">km/h</span>
                    </div>
                    <div class="workout__details">
                        <span class="workout__icon">⛰</span>
                        <span class="workout__value">${workout.elevationGain}</span>
                        <span class="workout__unit">m</span>
                    </div>
                </li>`;
        }

        form.insertAdjacentHTML("afterend", htmlWorkoutListItem);
    }

    _getLocalStorageOfWorkouts() {
        const dataOfWorkouts = JSON.parse(localStorage.getItem("workouts"));
        console.log(dataOfWorkouts);

        if (!dataOfWorkouts) return;

        this.#workouts = dataOfWorkouts;

        this.#workouts.forEach(workout => {
            this._renderWorkoutListItem(workout);
            // this._renderWorkoutMarker(workout);
        })
    }

    _setLocalStorageOfWorkouts() {
        //
        localStorage.setItem("workouts", JSON.stringify(this.#workouts));
    }

    _createNewWorkout(event) {
        //
        const validInputs = (...inputs) =>
            inputs.every(input => Number.isFinite(input));
        const allPositive = (...inputs) =>
            inputs.every(input => input > 0);

        //
        event.preventDefault();

        // Get data from form
        const type = inputType.value;
        const distance = +inputDistance.value;
        const duration = +inputDuration.value;
        const { lat, lng } = this.#mapEvent.latlng;
        let workout;


        // If workout is running, create running object
        if (type === "running") {
            const cadence = +inputCadence.value;
            // console.log(distance, inputDistance.value, duration, cadence);
            // Check if data is valid 
            if (
                // !Number.isFinite(distance) ||
                // !Number.isFinite(duration) ||
                // !Number.isFinite(cadence)
                !validInputs(distance, duration, cadence) || 
                !allPositive(distance, duration, cadence))
                return alert("Inputs have to be positive numbers");

            workout = new Running([lat, lng], distance, duration, cadence);
        }

        // If workout is cycling, create cycling object
        if (type === "cycling") {
            const elevation = +inputElevation.value;
            // Check if data is valid 
            if (!validInputs(distance, duration, elevation) || 
                !allPositive(distance, duration))
                return alert("Inputs have to be positive numbers");

            workout = new Cycling([lat, lng], distance, duration, elevation);
        }

        // Add new object to work out array 
        this.#workouts.push(workout);
        console.log(workout);

        // Render workout on map as marker 
        this._renderWorkoutMarker(workout);
        //Display marker
        // const { lat, lng } = this.#mapEvent.latlng;

        // L.marker([lat, lng]).addTo(this.#map)
        //     .bindPopup(L.popup({
        //         maxWidth: 250,
        //         minWidth: 100,
        //         autoClose: false,
        //         closeOnClick: false,
        //         className: `${type}-popup`
        //     }))
        //     .setPopupContent("Workout")
        //     .openPopup();

        // Render workout on list 
        this._renderWorkoutListItem(workout);

        // Hide form + clear input fields
        this._hideForm();

        // Set local storage  of all workouts
        this._setLocalStorageOfWorkouts();

        //Clear input fields 
        // inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value = "";

        // //Display marker
        // const { lat, lng } = this.#mapEvent.latlng;

        // L.marker([lat, lng]).addTo(this.#map)
        //     .bindPopup(L.popup({
        //         maxWidth: 250,
        //         minWidth: 100,
        //         autoClose: false,
        //         closeOnClick: false,
        //         className: "running-popup"
        //     }))
        //     .setPopupContent("Workout")
        //     .openPopup();

        // //Clear input fields 
        // inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value = "";
    }

    _moveMapToPopupMarker(event) {
        const workoutListItem = event.target.closest(".workout");
        // console.log(workoutListItem);

        // Me: because workoutListItem could be null
        if (!workoutListItem) return;

        const workout = this.#workouts.find(workout => workout.id === workoutListItem.dataset.id);
        console.log(workout);

        this.#map.setView(workout.coords, this.#mapZoomLevel, {
            animation: true,
            pan: {
                duration: 1
            }
        });

        // using the public interface
        workout.click();
    }

    reset() {
        localStorage.removeItem("workouts");
        location.reload();
    }
}

const app = new App();


// if (navigator.geolocation)
//     navigator.geolocation.getCurrentPosition(function(position) {
//         // console.log(position);
//         // const { latitude, longitude } = position.coords;
//         const { latitude } = position.coords;
//         const { longitude } = position.coords;
//         // console.log(latitude, longitude);
//         console.log(`https://www.google.com/maps/@${latitude},${longitude}`);

//         Leaflet Library
//         const coords = [latitude, longitude];

//         map = L.map('map').setView(coords, 13);
//         // console.log(map);

//         // L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
//         //     attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
//         // }).addTo(map);

//         L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
//             attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
//         }).addTo(map);

//         // L.marker(coords).addTo(map)
//         //     .bindPopup('A pretty CSS popup.<br> Easily customizable.')
//         //     .openPopup();


//         //Handling clicks on map
//         map.on("click", function(mapEve) {
//             // console.log(mapEvent);
//             // //
//             // const {lat, lng} = mapEvent.latlng;

//             // L.marker([lat, lng]).addTo(map)
//             //     .bindPopup(L.popup({
//             //         maxWidth: 250,
//             //         minWidth: 100,
//             //         autoClose: false,
//             //         closeOnClick: false,
//             //         className: "running-popup"
//             //     }))
//             //     .setPopupContent("Workout")
//             //     .openPopup();

//             
//             mapEvent = mapEve;
//             form.classList.remove("hidden");
//             inputDistance.focus();
//         });
//         //
//     }, function() {
//         alert("Could not get your position");
//     });



// form.addEventListener("submit", function(event) {
//     event.preventDefault();

//     //Display marker
//     const { lat, lng } = mapEvent.latlng;

//     L.marker([lat, lng]).addTo(map)
//         .bindPopup(L.popup({
//             maxWidth: 250,
//             minWidth: 100,
//             autoClose: false,
//             closeOnClick: false,
//             className: "running-popup"
//         }))
//         .setPopupContent("Workout")
//         .openPopup();

//     //Clear input fields 
//     inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value = "";
// });


// inputType.addEventListener("change", function() {
//     inputCadence.closest(".form__row").classList.toggle("form__row--hidden");
//     inputElevation.closest(".form__row").classList.toggle("form__row--hidden");
// });

