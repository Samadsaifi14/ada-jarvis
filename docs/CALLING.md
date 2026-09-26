# Telephone calling

ADA separates deciding to call from transporting realtime audio.

The included Twilio adapter can originate a call after approval. The voice webhook must then either play a generated briefing or bridge audio to a realtime voice agent such as LiveKit/Pipecat that can call ADA's private API.

For India, provider and regulatory requirements can change. Twilio is a reference adapter; Exotel or another SIP provider can implement the same call(to) interface.

A production bridge should verify provider signatures, authenticate requests, rate-limit calls, allow-list destination numbers, avoid recording by default and never expose the local ADA API publicly.
