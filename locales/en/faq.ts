export default {
    faq: {
        heading: 'Frequently Asked Questions',
        question1: 'Does Shikuf trade for me?',
        answer1: 'No, Shikuf is not a brokerage. You execute trades on your broker and then transfer the data into Shikuf to track and analyze your trading performance.',
        question2: 'How secure is Shikuf?',
        answer2: 'Your data security is our top priority. Shikuf does not sell or advertise your data, and we employ industry-standard security measures to protect your information.',
        question3: 'How Shikuf syncs my trading history:',
        answer3: 'We have developed our own syncing services with Rithmic, Tradovate and the Thor copier. They both work differently. Rithmic for example, doesn\'t allow OAuth, and for security reasons we don\'t store your credentials. They are securely stored on your computer and accessed from the shikuf sync engine only when you\'re connected. Tradovate on the other hand allows OAuth flow, which enables Shikuf to request a read access to your trading history and back up your trades daily even if you don\'t log to Shikuf. Finally Thor works by saving all your trading data on their server and you decide when to upload your data to shikuf using their software.',
        question4: 'How to update to latest version?',
        answer4: 'Shikuf operates as a web app which allows updates to reflect instantly in your browser. You don\'t need to run updates.',
        question5: 'Is it possible to run Shikuf locally?',
        answer5: 'Shikuf isn\'t available for local deployment as you won\'t be able to use sync services (which require conformance) but we are working on a local version with full support for .csv and .pdf uploads',
        question6: 'Why Plus plan doesn\'t provide a trial period?',
        answer6: 'Shikuf offers a free (no time limit) version contrary to other trading journal. You can keep using this version, while data storage is only provided for 14 rolling days. You\'ll lose access to your trading history. This Free version offers you plenty enough time to try out different features.',
    },
} as const;
