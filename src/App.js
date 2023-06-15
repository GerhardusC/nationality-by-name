import { useEffect, useState, useRef } from 'react';
import './App.css';

function NationalityGuesser() {
  //Using reference for userInput, because I don't want a re-render when the user types into the input box, but I want to keep track of its value.
  const userInput = useRef();
  const prevUserInput = useRef();

  //Using state for the probability of a nationality, the country object (In the country object we get the flag url and the country name).
  const [countryProbability, setCountryProbability] = useState(null);
  const [countryPrediction, setCountryPrediction] = useState(null);
  //Also using state to store a bool flag for the api call. This allows me to use the useEffect function to do the api call and have access to a cleanup function.
  const [apiCalled, setApiCalled] = useState(false);
  //Using state for the statusText of the api calls. This gets updated during the api call and also gets shown to the user.
  const [statusText, setStatusText] = useState("");

  //This function is run when the button is clicked. If the input box is not empty we change the apiCalled state to true. This triggers the useEffect below, which handles the api call.
  const handleClick = (e) => {
    if(userInput.current.value !== ""){
      setApiCalled(true);
    } else {
      //Otherwise if there is no api call to be made, because the input-field is empty, we change the styling of the button that was clicked.
      e.target.className = "custom-button-no-input"
      e.target.innerText = "No input"
      //I like the styling to last for only 800ms, because it looks nice and it is just long enough to read.
      let myTimeout = setTimeout( () => {
        e.target.className = "custom-button"
        e.target.innerText = "Check name"
        clearTimeout(myTimeout)
      }
      , 800)
    }
  }
  //
  useEffect(() => {
    //As soon as the apiCalled state changes to true, the data is fetched from the nationalise api. I was experimenting not having the if(apiCalled) here, but it seems to run twice sometimes if its not here.
    if (apiCalled) {
      const getNameData = async () => {
        //Setting the initial status text to fetching data, so the user knows what is happening.
        setStatusText("Fetching data...")
        try {
          //Try fetch the name the user input from the api.
          let res = await fetch(`https://api.nationalize.io?name=${userInput.current.value.toLowerCase()}`);
          let predictionData = await res.json();
          //Set the state of the country probability to the value in the object we returned from the fetch.
          setCountryProbability(predictionData['country'][0]['probability']);
          //We then fetch some more details about the country using its country code from the restcountries api.
          let res2 = await fetch(`https://restcountries.com/v3.1/alpha/${predictionData['country'][0]['country_id']}`);
          let predictedCountry = await res2.json();
          //We then set the prediction to the predicted country.
          setCountryPrediction(predictedCountry);
          //And change the status text to success.
          setStatusText("Success!");
        } catch(err) {
          //If there is an error, we set the status text to fetch failed and set the country prediction both to null in case either of them changed.
          console.log(err)
          setStatusText("Fetch failed!")
          setCountryPrediction(null)
          setCountryProbability(null)
        } finally {
          //Finally save the name that the user put in into a new reference, because we want to clear the input box and remember the user's input at the time of firing the event.
          prevUserInput.current = userInput.current.value;
          userInput.current.value = "";
          //Finally after a short cosmetic delay, the status text is reset.
          let myTimeout = setTimeout(
            () => {
              setStatusText("");
              clearTimeout(myTimeout);              
          }
          , 1500)
          }
        }
        //Calling the async function defined above.
        getNameData();
      }
    return () => {
      //Cleaning up by setting apiCalled to false.
      setApiCalled(false);
    }
  }, [apiCalled, userInput])

  //As per the brief, here is the auto-focussed input field.
  useEffect( () => {
      userInput.current.focus()
  })
  //The application is small enough that I returned everything in one component, I would probably separate it and use props when the application grows.
  return (
    <>
      {/* This is the input form that has the button the fires the event and the input text box. */}
      <div className='input-form'>
          <label htmlFor='user-country-input'>Country guesser</label>
          <input id='user-country-input' placeholder='Enter your name' ref={userInput} type='text' onChange={(e) => {userInput.current = e.target}} />
          <button className='custom-button' onClick={handleClick}>Check name</button>
      </div>
      {/* If there is a country prediction, it is shown. The flag url is passed to the img element and the initially typed name and probability are also displayed here. */}
      <div>
          {countryPrediction !== null ? 
            <div className='prediction-display'>
              <img src={countryPrediction[0]['flags']['png']} alt={countryPrediction[0]['flags']['alt']} />
              <div className='prediction'><span style={{fontWeight: 'bold'}}>{prevUserInput.current}</span>, there is a {Math.round(countryProbability*100)}% chance you are from <span style={{fontWeight: 'bold'}}>{countryPrediction[0]["name"]["common"]}</span>.</div>
            </div>
           : 
            < div className='no-prediction'></div>
          }
        {/* This is the little status block that displays the fetching status. */}
        <div className={statusText === "Fetching data..." ? "status-fetching" : statusText === "Success!" ? "status-fetch-successful" : statusText === "" ? "status-no-fetch" : "status-fetch-failed"}>
          {statusText}
        </div>
      </div>
    </>
  );
}



function App() {
  return (
    <div className="App">
      <NationalityGuesser />
    </div>
  );
}
export default App;
