const express = require('express')
const app = express()
var twilio = require('twilio');
var bodyParser = require('body-parser')
const axios = require('axios');
var csv = require('csvtojson')

function getDate() {
    var date = new Date();
    var dd = String(date.getDate() - 1).padStart(2, '0');//so that we get yesterday's data
    var mm = String(date.getMonth() + 1).padStart(2, '0'); //January is 0!
    var yyyy = date.getFullYear();

    return mm + '-' + dd + '-' + yyyy;
}

app.use(bodyParser())

const port = 4000


var accountSid = 'ACa1b8d77fa627b46285fb2236cd94cc22'; // Your Account SID from www.twilio.com/console
var authToken = '982c71fb4e5af019c355f909024113e3';   // Your Auth Token from www.twilio.com/console
var client = new twilio(accountSid, authToken);

app.get('/', (req, res) => {

    date = getDate()
    preferred_country = "Canada"

    url = "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_daily_reports/" + getDate() + ".csv"
    axios.get(url)
        .then(response => {
            var confirmed = 0, deaths = 0, recovered = 0, active = 0;

            csv().fromString(response.data).then((data_json) => {


                var country_data = data_json.filter(entry => entry.Country_Region == "Canada")
                var bruh
                country_data.forEach(entry => {
                    confirmed = confirmed + parseInt(entry.Confirmed);
                })
                console.log(confirmed)
                res.send('Working')
            })
        })
        .catch(error => {
            console.log(error);
        });
})

app.post('/sms', async (req, res) => {
    var response_body = "Hello"
    var client_phone_num = req.body.From
    var server_phone_num = req.body.To
    var body = req.body.Body



    date = getDate()
    preferred_country = body

    url = "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_daily_reports/" + getDate() + ".csv"
    axios.get(url)
        .then(response => {
            var confirmed = 0, deaths = 0, recovered = 0;

            csv().fromString(response.data).then((data_json) => {
                function getCountriesList() {
                    var countries_list = [];

                    var count = 0;
                    var start = false;

                    for (j = 0; j < data_json.length; j++) {
                        for (k = 0; k < countries_list.length; k++) {
                            if (data_json[j].Country_Region == countries_list[k]) {
                                start = true;
                            }
                        }
                        count++;
                        if (count == 1 && start == false) {
                            countries_list.push(data_json[j].Country_Region);
                        }
                        start = false;
                        count = 0;
                    }

                    return countries_list
                }

                var countries_list = getCountriesList()

                var countryCheck = countries_list.indexOf(preferred_country);

                if (countryCheck != -1) {
                    var country_data = data_json.filter(entry => entry.Country_Region == preferred_country)
                    country_data.forEach(entry => {
                        confirmed = confirmed + parseInt(entry.Confirmed);
                        deaths = deaths + parseInt(entry.Deaths)
                        recovered = recovered + parseInt(entry.Recovered)
                    })
                    console.log(confirmed)
                    res.send('Working')

                    response_body = `Statistics for ${preferred_country}:\nConfirmed cases: ${confirmed}\nDeaths: ${deaths}\nRecovered: ${recovered}\nLast updated: ${date}`
                }

                else if (body == "Global") {
                    data_json.forEach(entry => {
                        confirmed = confirmed + parseInt(entry.Confirmed);
                        deaths = deaths + parseInt(entry.Deaths)
                        recovered = recovered + parseInt(entry.Recovered)
                    })

                    response_body = `Global Overview:\nConfirmed cases: ${confirmed}\nDeaths: ${deaths}\nRecovered: ${recovered}\nLast updated: ${date}`
                }

                else {
                    var country_list_string = ""
                    countries_list.forEach(country => {
                        country_list_string = country_list_string + country + "\n"
                    })
                    console.log('rbuh')
                    response_body = `The country you have entered isn't in our directory. The first letter of the country should be capitalized. Our directory uses a few abbreviations and exceptions: "US", "Korea, South", "Taiwan*", "Congo (Brazzaville)" and "Congo (Kinshasa)". Type "Global" for a global statistic.`
                }


                client.messages.create({
                    body: response_body,
                    from: server_phone_num,
                    to: client_phone_num
                }).then(message => {
                    console.log(message.sid)
                    res.send('Message sent')
                })
            })
        })
        .catch(error => {
            console.log(error);
        });


})

app.listen(port, () => console.log(`App listening on port ${port}!`))
