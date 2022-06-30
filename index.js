const config = require('config');
const express = require('express');
const { Elarian } = require('elarian');
const cors = require('cors');
const bodyParser = require('body-parser')
const log = require('signale');
const fs = require('fs')

const smsChannel = config.get('elarian.channel.sms');
const paybill = config.get('elarian.channel.paybill');
const purseId = config.get('elarian.channel.purseId');

const app = express();
app.use(cors())
app.use(bodyParser.json());

let elarian;
const writer = fs.createWriteStream('customers.txt', {
  flags: 'a' // 'a' means appending (old data will be preserved)
})

const sendPayment = async (contact, amount) => {
    log.info(`Paying ${contact} KES${amount}`);
    const result = await elarian.initiatePayment({
         purseId: 'el_prs_C6DQgR',
    }, {
        channelNumber: {
            number: '30001',
            'channel': 'cellular'
        },
        customerNumber: {
            'number': contact,
            'provider': 'cellular'
        },
    }, {
        amount: amount,
        currencyCode: 'KES',
    }, 'Payment Disbursed');

    log.info(result)
}

const registerTeamDetails = async (team) => {
    console.log(`Registering team ${team}`);
    // Create customer object
    const user = new elarian.Customer({
        number: team.contact,
        provider: 'cellular'
    });

    let members = team.members.map(member => {
        return member.name + ":" + member.contact;
    })
    // console.log(members);

    await user.updateMetadata({
        name: team.name,
        email: team.email,
        contact: team.contact,
        members: members.join(';'),
        idea: team.idea,
        title: team.title,
        points: 1,
    })

    const state = await user.getState();

    console.log(state);

    // console.log(state.identityState.metadata.contact);

    writer.write(`\n${state.customerId}#${state.identityState.metadata.email}`);

    let text = `Congratulations! Your idea "${state.identityState.metadata.title}" has successfully been submitted.`

    await user.sendMessage(
        config.get('elarian.channel.sms'),
        { body: { text: text } },
    );
    log.success("Message sent")
    return state

};

app.get('/', async (req, res) => {
    res.send('Hello Sergio!');
});

app.get('/tallyWinners', async (req, res) => {
    let array = fs.readFileSync('customers.txt').toString().split("\n");

    customers_dict = {}

    for (customer of array) {
        log.info(customer)
        let customer_id = customer.split("#")[0];
        customer_obj = new elarian.Customer({ id: customer_id });
        let {points} = await customer_obj.getMetadata();
        customers_dict[customer_id] = points;
    }
    log.info(customers_dict);

    let items = Object.keys(customers_dict).map((key) => { return [key, customers_dict[key]] });

    items.sort((first, second) => { return first[1] - second[1] });

    log.info(items)

    let winner = items.pop();
    let runnerUp = items.pop();
    let secondRunnerUp = items.pop();

    // let team = new elarian.Customer({ id: id });

    let winner_obj = new elarian.Customer({ id: winner[0] });
    // log.info(await winner_obj.getMetadata())
    let runner_up_obj = new elarian.Customer({ id: runnerUp[0] });
    let second_runner_up_obj = new elarian.Customer({ id: secondRunnerUp[0] });

    let winner_data = await winner_obj.getMetadata();
    let winner_contact = winner_data.contact

    let runner_up_data = await runner_up_obj.getMetadata();
    let runner_up_contact = runner_up_data.contact

    let second_data = await second_runner_up_obj.getMetadata();
    let second_contact = second_data.contact

    log.info("Message 1 sent")
    // log.info(await winner_obj.getMetadata());
    log.info( config.get('elarian.channel.paybill.number'))

    await sendPayment(winner_contact, '10000')
    await sendPayment(runner_up_contact, '5000')
    await sendPayment(second_contact, '2500')

    await winner_obj.sendMessage(
        config.get('elarian.channel.sms'),
        { body: { text: "Congratulations you are the winner! Pokea 10k 🎉" } },
    );

    await runner_up_obj.sendMessage(
        config.get('elarian.channel.sms'),
        { body: { text: "Congratulations you are the Runner Up. Pewa 5000🎉" } },
    );

    await second_runner_up_obj.sendMessage(
        config.get('elarian.channel.sms'),
        { body: { text: "Congratulations you are the Second Runner Up. Pokea 2500🎉" } },
    );

    res.send("Results tallied and payments disbursed")



console.log(items);

    // for (i of array) {
    //     customer =
    // }

    // if let line of
});

app.get('/login', async (req, res) => {
    let email = "sejesergio@gmail.com"
    log.info("logging team in")
    let array = await fs.readFileSync('customers.txt').toString().split("\n");
    let emails = {}
    for (i of array) {
        const customer = i.split(":");
        emails[customer[2]] = {id: customer[0] , contact: customer[1]};
    }
    if (emails[email]) {
        log.info("logged in")
        return res.send({id: emails[email].id, email: emails[email].email, contact: emails[email].contact})
    }
    return res.send({error: "User not found"})
});

app.get('/register', (req, res) => {
    const team = {
        name: 'votr',
        email: 'sejesergio@gmail.com',
        contact: '+254743287562',
        team_size: '4',
        title: 'My Awesome App Idea 2',
        members: [
            {
                name: 'sejesergio',
                contact: '1234565',
            },
            {
                name: 'lewis',
                contact: '1234567',
            },
            {
                name: 'ochieng',
                contact: '1234568',
            },
            {
                name: 'edddie',
                contact: 'kago',
            }
        ],
        idea: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum."
    }

    let teamObject = registerTeamDetails(team)
    if (teamObject) {
        return res.send({msg: "Team registration successful"})
    }
    return res.send({error: "Unable to register team"})
});

app.get('/getIdeas', async (req, res) => {
    let array = await fs.readFileSync('customers.txt').toString().split("\n");
    let teams = []
    for (i of array) {
        const customer = i.split("#");
        let customer_obj = new elarian.Customer({ id: customer[0] });
        teams.push(await customer_obj.getMetadata());
    }
    log.info(teams)
    res.send(teams)
});

app.get('/updatePoints', async (req, res) => {

    // let id = "el_cst_05a97c3f0ee60d02d2ae7f13cdfe17b9"
    log.info(req.query.id)

    let id = req.query.id

    let team = new elarian.Customer({ id: id });

    let {points} = await team.getMetadata();

    await team.updateMetadata({ points: points + 1 });

    let { title } = await team.getMetadata();

    await team.sendMessage(
        config.get('elarian.channel.sms'),
        { body: { text: `Congratulations Team "${title}". You have been awarded 1 point` } },
    );

    return res.send({msg: "Points updated"})
})

app.listen(3000, () => {
    console.log('App listening at http://localhost:3000');
    elarian = new Elarian(config.get('elarian.client'));

    elarian.on('error', (error) => {
                log.warn(error.message || error);
            })
            .on('connected', () => {
                log.success(`App is connected, waiting for customers on ${smsChannel}`);
            })
            .connect();



//   elarian
//     // .on('reminder', handleRemiderEvent)
//     // .on('customerActivity', handleActivityEvent)
//     .on('connected', () => { console.info('Elarian connected!');})
//     .on('error', (error) => { console.error(`Elarian error: ${error}`); })
//     .connect();
});