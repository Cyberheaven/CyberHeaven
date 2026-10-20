---
title: "OSINT for Beginners: Getting Started with Open Source Intelligence"
category: "Tutorials"
date: 2026-10-12
author: "Pablo Rodriguez Sanz"
excerpt: "Hey there! Even if you’re just starting in cybersecurity or you’re a seasoned veteran red/blue teamer, you’ll have something new to learn. Remember, OSINT skills can be used not only in the cybersecurity field, but also in law enforcement, market analysis, and business."
cover: "/media/2026/10/photo_2026-10-03_11-13-29.jpg"
coverAlt: "OSINT"
tags: ["Cybersecurity", "Digital Investigation", "Open Source Intelligence", "OSINT", "OSINT Framework", "OSINT Methodology"]
draft: false
---

Hey there! Even if you’re just starting in cybersecurity or you’re a seasoned veteran red/blue teamer, you’ll have something new to learn. Remember, OSINT skills can be used not only in the cybersecurity field, but also in law enforcement, market analysis, and business.

I’ll be covering the OSINT series, where we’ll learn what it is, how it is used, build a VM together, install some tools, run our first investigation, and much more. So without any more delay, let’s dive right in.

## What is OSINT?

OSINT stands for Open-Source Intelligence, the practice of gathering, processing, and analyzing publicly available information to produce actionable intelligence for national security, law enforcement, cybersecurity, and business purposes.

Unlike intelligence disciplines that rely on classified information or other restricted sources, OSINT makes use of publicly available sources such as social media, news articles, public records, academic research, and government data. The important concept to understand here is that OSINT relies on publicly accessible information, but investigations must still respect applicable laws, privacy, and ethical boundaries.

OSINT is extremely important in the digital era, where huge amounts of information are being published on a daily basis. We have so much information at our fingertips that it is crucial to develop skills that help us filter out the “noise” to make good use of it.

Besides OSINT, there are other intelligence disciplines like HUMINT (Human Intelligence), SIGINT (Signals Intelligence), and IMINT (Imagery Intelligence).

## Intelligence vs Information

Information is data or facts gathered from sources that can help answer specific questions.

On the other hand, intelligence is information that has been evaluated and analyzed to provide useful insights for decision-making. They’re different in function and definition, but equally important in the decision-making process.

## OSINT use cases

Open-source intelligence is very versatile. It can be used in a wide array of areas, such as responding to disasters or emergencies, investigating cryptocurrency fraud, combating misinformation in news and social media, monitoring the reputation of companies, identifying potential supply chain risks, and assessing an organization’s exposure to threats in cybersecurity.

## Investigation mindset

Before every investigation, we need initial planning and clear goals about what we want, so as to avoid chasing irrelevant leads or falling into rabbit holes.

It’s crucial to establish ethical and legal boundaries. Why do we need this information? What are we going to do with it? And what could happen to people if this information were published?

Just because information can be found online does not mean we should collect or publish it.

A good investigation is not about finding as much information as possible. Instead, it is about finding the right information for our objective, while understanding the consequences of what we’re doing.

## OSINT cycle

The OSINT cycle can be divided into the following phases:

`Planning → Collection → Processing → Analysis → Dissemination → Feedback`

![](/media/2026/10/OSINT-Cycle-1024x576.png)

### Planning

This is the starting point of any investigation, and the first phase of the OSINT cycle. Here we need to define the requirements, our goals, the kind of data we expect to find, which tools are right for the job, and the most efficient way to conduct our research.

### Collection

In the second phase of the OSINT cycle, we gather data from public sources like social media, LinkedIn, websites, blogs, government records, etc. We may do it manually by browsing the web or by using automated tools.

### Processing

In the third phase, once we have collected the information, we need to organize it, check its reliability, record its sources, and distinguish relevant information from irrelevant or unverified data.

### Analysis

In the analysis phase, we need to find patterns, relationships between data, and anomalies. We also need to distinguish facts from assumptions and avoid drawing conclusions that the evidence does not support. We can do this with the help of data visualization tools.

### Dissemination

In this phase, we need to prepare a report about our findings and share it with the intended audience.

### Feedback

In the last phase of the OSINT cycle, we’ll come up with answers to questions such as:

What conclusions can we draw from our findings?

Which sources were useful?

What remains unknown?

What can be done to improve the investigation?

The OSINT cycle is an iterative process; new findings at any stage may feed back into previous steps.

> Know what you’re looking for, collect only useful information, check if it’s reliable, separate facts from assumptions, and turn your findings into conclusions.

## Boston Marathon Bombing (2013): An OSINT investigation

Now we’ll use Google search operators to find information and try to answer a few investigative questions. In future articles, we’ll learn more about the power of search operators.

1\. Who was responsible for the attack?

Initial discovery search:

`"Boston bomber" 2013`

We get the following:

<https://en.wikipedia.org/wiki/Boston_Marathon_bombing>

<https://en.wikipedia.org/wiki/Dzhokhar_Tsarnaev>

If we want to verify the information with FBI sources, we search:

`site:fbi.gov "Boston Marathon" bombing suspects`

Notice the operator site: It filters our search results to show only information from a specific website.

We find the following:

<https://www.fbi.gov/history/cases-and-criminals/boston-marathon-bombing>

  * Names: Dzhokhar and Tamerlan Tsarnaev.
  * Ages at the time: Dzhokhar was 19, while Tamerlan was 26.
  * Outcome: Tamerlan died during the manhunt, while Dzhokhar was later convicted.

2\. When and where did the attack take place?

Boston, April 15, 2013.

3\. What type of explosives were used?

Two pressure-cooker bombs.

<https://en.wikipedia.org/wiki/Pressure_cooker_bomb>

4\. Did anyone interfere with the investigation after the bombing?

In this case, we use the same operator, site:, but we’ll look into court records instead of relying on newspaper or Wikipedia articles:

`site:justice.gov "Boston Marathon" accomplice`

<https://www.justice.gov/usao-ma/pr/two-more-friends-sentenced-impeding-boston-marathon-bombing-investigation>

The report describes how Dias Kadyrbayev and Azamat Tazhayakov were convicted of obstructing the investigation, while Robel Phillipos was convicted of making false statements to investigators. Their actions interfered with the investigation, but they should not be confused with accomplices in carrying out the bombing itself.

5\. What examples of misinformation were made public?

`"Boston Marathon bombing" misinformation`

One of the first results is from the University of Washington. It discusses the misinformation and rumours that were shared on Twitter after the bombing.

<https://www.washington.edu/news/2014/03/17/hold-that-rt-much-misinformation-tweeted-after-2013-boston-marathon-bombing>

One example of misinformation was a rumour that an eight-year-old girl who had been running in the marathon had died in the bombings. In reality, the eight-year-old victim was Martin Richard, a boy who was watching the race.

The FBI released pictures of two suspects, and people on social media began speculating about their identities.

Throughout the course of the investigation, we gathered information about the identities of the bombers, people who interfered with the investigation, the explosives used, and examples of misinformation. This gives us a solid foundation for answering some of the most relevant questions and provides us with a starting point for further research if we want to take the investigation deeper.

Stay tuned because in the next article we’re going to build a dedicated OSINT VM in VirtualBox.
