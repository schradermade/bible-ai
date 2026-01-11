/**
 * Study Plan Templates
 *
 * Curated study plans for quick-start options alongside AI-personalized plans
 */

interface TemplateDay {
  dayNumber: number;
  title: string;
  content: string;
  reflection: string;
  verseReference: string;
  verseText: string;
}

interface Template {
  title: string;
  description: string;
  getDays: (duration: 7 | 21) => TemplateDay[];
}

export const STUDY_PLAN_TEMPLATES: Record<string, Template> = {
  template_grace: {
    title: 'Understanding Grace',
    description: 'Explore God\'s unmerited favor and transforming love',
    getDays: (duration: 7 | 21) => {
      const base7Days: TemplateDay[] = [
        {
          dayNumber: 1,
          title: 'Day 1: What is Grace?',
          content: 'Grace is God\'s undeserved favor freely given to humanity. Unlike the world\'s transactions where everything must be earned, God\'s grace flows from His loving character, not our merit. The Apostle Paul reminds us that salvation itself is a gift - not something we can achieve through our own efforts, good deeds, or religious observance. This foundational truth transforms how we approach God. We don\'t come to Him based on our performance, but on His performance through Christ. Grace means that when God looks at us through Jesus, He sees us as righteous, beloved, and accepted - not because we\'ve earned it, but because He delights in showing mercy. Understanding grace begins with recognizing we cannot save ourselves; we need a Savior who freely offers what we could never purchase.',
          reflection: 'How have you experienced God\'s grace in your life? In what ways do you still try to earn God\'s favor instead of receiving it as a gift?',
          verseReference: 'Ephesians 2:8-9',
          verseText: 'For by grace are ye saved through faith; and that not of yourselves: it is the gift of God: Not of works, lest any man should boast.'
        },
        {
          dayNumber: 2,
          title: 'Day 2: Grace in the Old Testament',
          content: 'Long before Jesus walked the earth, God\'s grace was evident throughout Scripture. When Noah found grace in the eyes of the Lord, it wasn\'t because he was perfect - it was because God chose to show him favor. The entire sacrificial system pointed to God\'s gracious provision for sin, offering atonement through the blood of animals until the perfect sacrifice would come. In the exodus, God delivered Israel not because they deserved freedom, but because He remembered His covenant and heard their cries. Time and again, when Israel rebelled and faced judgment, God\'s grace provided a way back through repentance and His steadfast love. The prophets spoke of a coming day when God would write His law on hearts, not tablets - a work of grace transforming from within. The Old Testament shows that grace has always been God\'s character, preparing the way for the ultimate expression of grace in Christ.',
          reflection: 'Where do you see God\'s grace at work in Old Testament stories? How does understanding God\'s historical faithfulness strengthen your trust in His grace today?',
          verseReference: 'Genesis 6:8',
          verseText: 'But Noah found grace in the eyes of the Lord.'
        },
        {
          dayNumber: 3,
          title: 'Day 3: The Cost of Grace',
          content: 'Grace is free to us but was infinitely costly to God. While we receive salvation as a gift, it required the precious blood of Christ - God\'s own Son - to purchase our redemption. On the cross, Jesus bore the full weight of God\'s wrath against sin, taking the punishment we deserved so we could receive the righteousness we don\'t deserve. This is the great exchange: our sin for His righteousness, our death for His life. Grace doesn\'t mean God overlooked our sin or pretended it wasn\'t serious; rather, He took it so seriously that only the death of His Son could satisfy divine justice. The cross demonstrates both God\'s love and His holiness - His grace meeting His righteousness in perfect harmony. Understanding what grace cost God should move us to profound gratitude, deep humility, and a life of worship.',
          reflection: 'How does understanding what grace cost Jesus change how you view sin and temptation? What would it look like to live in gratitude for such costly grace?',
          verseReference: '1 Peter 1:18-19',
          verseText: 'Forasmuch as ye know that ye were not redeemed with corruptible things, as silver and gold, from your vain conversation received by tradition from your fathers; But with the precious blood of Christ, as of a lamb without blemish and without spot.'
        },
        {
          dayNumber: 4,
          title: 'Day 4: Living by Grace',
          content: 'Receiving grace changes everything about how we live. Paul teaches that while we are no longer under law but under grace, this doesn\'t mean we\'re free to sin without consequence. Rather, grace empowers us to live righteously in ways the law never could. When we understand that God loves us unconditionally, we\'re motivated by love rather than obligation. The same grace that saved us continues to work in us, transforming our desires and enabling godliness. Living by grace means admitting weakness and depending on God\'s strength. It means extending to others the same mercy we\'ve received. It means that when we fail, we confess, receive forgiveness, and move forward - not trapped in guilt or self-condemnation. Grace teaches us to say no to ungodliness not through sheer willpower, but through the power of Christ working within us. This is the victorious Christian life - not sinless perfection, but daily dependence on His sufficient grace.',
          reflection: 'Are you living by grace or by works? What areas of your life need to shift from self-effort to dependence on God\'s grace?',
          verseReference: 'Romans 6:14',
          verseText: 'For sin shall not have dominion over you: for ye are not under the law, but under grace.'
        },
        {
          dayNumber: 5,
          title: 'Day 5: Grace and Truth',
          content: 'Jesus came full of both grace and truth - not grace without truth, nor truth without grace. Some emphasize God\'s love so much they minimize sin; others emphasize holiness so much they lose sight of mercy. But Jesus held both in perfect balance. He showed grace to the woman caught in adultery, but also commanded her to "go and sin no more." He welcomed sinners and ate with them, yet He called them to repentance. Grace doesn\'t ignore sin; it provides the power to overcome it. Truth without grace becomes legalism; grace without truth becomes license. The gospel holds them together: we are far worse than we ever imagined (truth), and far more loved than we ever dreamed (grace). This balance keeps us from both pride and despair. We face the reality of our sin honestly while resting in the sufficiency of Christ\'s grace to cover it completely.',
          reflection: 'Do you tend to emphasize grace at the expense of truth, or truth at the expense of grace? How can you hold both in better balance?',
          verseReference: 'John 1:14',
          verseText: 'And the Word was made flesh, and dwelt among us, (and we beheld his glory, the glory as of the only begotten of the Father,) full of grace and truth.'
        },
        {
          dayNumber: 6,
          title: 'Day 6: Extending Grace to Others',
          content: 'Having received immeasurable grace from God, we\'re called to extend grace to those around us. This is one of the most challenging aspects of Christian living - forgiving as we\'ve been forgiven, showing mercy as we\'ve received mercy. Jesus made it clear: if we\'ve been forgiven a massive debt, how can we refuse to forgive the small debts others owe us? Extending grace doesn\'t mean pretending wrongs didn\'t happen or enabling destructive behavior. Rather, it means releasing bitterness, choosing not to hold offenses against others, and treating them with the same patient kindness God shows us daily. This grace-filled living creates communities of hope and restoration. It means giving people second chances, speaking encouragingly, and covering offenses with love. When we struggle to extend grace, it often reveals we haven\'t fully grasped the grace we\'ve received.',
          reflection: 'Who in your life needs to receive grace from you? What makes it difficult to extend grace to them? How can remembering God\'s grace to you help?',
          verseReference: 'Colossians 3:13',
          verseText: 'Forbearing one another, and forgiving one another, if any man have a quarrel against any: even as Christ forgave you, so also do ye.'
        },
        {
          dayNumber: 7,
          title: 'Day 7: Sufficient Grace',
          content: 'God\'s grace is always enough. Whatever trial you face, whatever weakness you struggle with, whatever burden you carry - His grace is sufficient. Paul learned this when God refused to remove his "thorn in the flesh," instead promising that divine grace was adequate for his need. Sometimes God\'s grace comes in the form of deliverance; other times it comes as strength to endure. His grace sustains the grieving, comforts the lonely, strengthens the tempted, and upholds the weary. It\'s the grace that meets us in our darkest moments and whispers, "My strength is made perfect in weakness." We may not understand why God allows certain trials, but we can trust that His grace will be present in them. Every day brings fresh grace - enough for today, not necessarily for tomorrow. We learn to take one day at a time, trusting that each morning will bring new mercies and renewed strength. This is the life of faith: depending daily on sufficient grace.',
          reflection: 'What area of weakness or struggle do you need to trust God\'s sufficient grace for today? How has God\'s grace proven sufficient in past difficulties?',
          verseReference: '2 Corinthians 12:9',
          verseText: 'And he said unto me, My grace is sufficient for thee: for my strength is made perfect in weakness. Most gladly therefore will I rather glory in my infirmities, that the power of Christ may rest upon me.'
        }
      ];

      if (duration === 7) {
        return base7Days;
      }

      // For 21-day plans, include expanded content
      const expanded14Days: TemplateDay[] = [
        {
          dayNumber: 8,
          title: 'Day 8: Grace vs. Works',
          content: 'The tension between grace and works has confused believers throughout church history. Paul addressed this repeatedly, especially in Galatians where churches were being told they needed to add circumcision and law-keeping to their faith in Christ. The apostle was adamant: adding anything to grace nullifies it. Either salvation is entirely by grace through faith, or it\'s by works - it can\'t be both. Yet this raises a question: if salvation is by grace alone, what about good works? Paul clarifies that we\'re saved by grace FOR good works, not BY good works. Works are the fruit of salvation, not the root. They flow from a heart transformed by grace, not from a desperate attempt to earn God\'s favor. When we grasp this distinction, it frees us from the exhausting treadmill of performance-based religion while motivating us toward genuine godliness fueled by gratitude.',
          reflection: 'Where are you tempted to add works to grace? How does understanding grace as the source rather than the result of good works change your motivation?',
          verseReference: 'Galatians 2:21',
          verseText: 'I do not frustrate the grace of God: for if righteousness come by the law, then Christ is dead in vain.'
        },
        {
          dayNumber: 9,
          title: 'Day 9: Growing in Grace',
          content: 'Peter\'s final exhortation is to "grow in grace and in the knowledge of our Lord." Grace isn\'t just our entry point into Christianity; it\'s also the means of our spiritual growth. As we mature in Christ, we don\'t graduate from grace to something else - we grow deeper into it. Growing in grace means increasingly understanding how much we need it, recognizing God\'s grace in more areas of life, and becoming more grace-filled people. It involves the spiritual disciplines - prayer, Scripture reading, fellowship, worship - not as ways to earn God\'s approval but as means by which we position ourselves to receive more grace. Like a plant needs both sunlight and water to grow, believers need both truth and grace. We grow as we feed on God\'s Word, spend time in His presence, and fellowship with other believers who encourage us toward Christ.',
          reflection: 'What does growing in grace look like practically in your life? What spiritual disciplines help you receive and experience more of God\'s grace?',
          verseReference: '2 Peter 3:18',
          verseText: 'But grow in grace, and in the knowledge of our Lord and Saviour Jesus Christ. To him be glory both now and for ever. Amen.'
        },
        {
          dayNumber: 10,
          title: 'Day 10: Grace for Every Season',
          content: 'God\'s grace adapts to every season and circumstance of life. In times of prosperity, it keeps us grateful and generous. In seasons of suffering, it provides comfort and endurance. When we\'re healthy, grace reminds us of our dependence on God. When we\'re sick, grace sustains us through weakness. In youth, grace guides and protects. In old age, grace carries us when strength fails. The author of Hebrews assures us that we can approach God\'s throne of grace with confidence, finding help in time of need. This means grace is never theoretical or distant - it\'s always available, always sufficient, always perfectly timed. Whatever season you\'re in right now, specific grace is available for it. Don\'t face today with yesterday\'s grace or worry about tomorrow with insufficient grace. Today\'s challenges have today\'s grace.',
          reflection: 'What season are you in right now? How do you need to experience God\'s grace specifically for this season?',
          verseReference: 'Hebrews 4:16',
          verseText: 'Let us therefore come boldly unto the throne of grace, that we may obtain mercy, and find grace to help in time of need.'
        },
        // Continue with days 11-21...
        {
          dayNumber: 11,
          title: 'Day 11: Grace and Humility',
          content: 'Grace and humility are inseparable. James tells us that "God opposes the proud but gives grace to the humble." Pride says "I can do this on my own"; humility says "I desperately need God\'s grace." Pride takes credit; humility gives glory to God. Pride compares itself to others and feels superior; humility recognizes that any good in us comes from God\'s grace working within us. The moment we think we\'ve arrived spiritually or outgrown our need for grace, we\'ve fallen into pride. The greatest saints have always been those most aware of their need for grace. Paul called himself the "chief of sinners" even after decades of ministry. True spiritual maturity isn\'t thinking we\'re wonderful; it\'s thinking we\'re nothing without Christ and everything in Him. Humility positions us to receive abundant grace.',
          reflection: 'Where does pride show up in your life? How can cultivating humility help you receive and experience more of God\'s grace?',
          verseReference: 'James 4:6',
          verseText: 'But he giveth more grace. Wherefore he saith, God resisteth the proud, but giveth grace unto the humble.'
        },
        {
          dayNumber: 12,
          title: 'Day 12: The Grace of Giving',
          content: 'Paul described the Macedonian churches\' generous giving as "the grace of God." This reveals something profound: grace isn\'t just what we receive; it\'s what enables us to give. Financial generosity, sacrificial service, sharing our time and talents - all flow from experiencing God\'s grace. Those who truly understand how much they\'ve been given in Christ become the most generous givers. They hold possessions loosely, knowing everything belongs to God anyway. They give cheerfully, not grudgingly, because grace has liberated them from greed and materialism. This giving grace extends beyond money to include forgiveness, encouragement, hospitality, and kindness. When we\'ve been recipients of such extravagant grace, how can we be stingy with others? Grace received becomes grace extended.',
          reflection: 'How has experiencing God\'s grace made you more generous? What area of giving - whether time, money, forgiveness, or service - is God calling you to grow in?',
          verseReference: '2 Corinthians 8:1',
          verseText: 'Moreover, brethren, we do you to wit of the grace of God bestowed on the churches of Macedonia.'
        },
        {
          dayNumber: 13,
          title: 'Day 13: Common Grace',
          content: 'Theologians distinguish between "saving grace" and "common grace." Saving grace brings salvation; common grace is God\'s goodness to all humanity regardless of their relationship with Him. The rain falls on both the righteous and unrighteous. The sun shines on believers and unbelievers alike. God provides beauty in creation, the joys of family and friendship, artistic expression, and countless daily blessings to all people. This common grace serves several purposes: it restrains evil, enabling society to function; it reveals God\'s kindness, designed to lead people to repentance; and it provides a preview of His goodness. Even unbelievers experience God\'s grace daily, though they may not recognize its source. This should humble us and move us to thankfulness - we deserve nothing but receive everything.',
          reflection: 'What examples of God\'s common grace do you see in your daily life? How can recognizing His goodness to all people change how you view and treat unbelievers?',
          verseReference: 'Matthew 5:45',
          verseText: 'That ye may be the children of your Father which is in heaven: for he maketh his sun to rise on the evil and on the good, and sendeth rain on the just and on the unjust.'
        },
        {
          dayNumber: 14,
          title: 'Day 14: Resisting Grace',
          content: 'Perhaps the greatest tragedy is rejecting God\'s offered grace. Stephen accused the religious leaders of always resisting the Holy Spirit. Throughout history, people have heard the gospel, felt conviction, sensed God\'s call - and said no. Some resist because they love their sin more than they love God. Others resist out of pride, unwilling to admit their need. Still others resist due to fear of what surrender might cost. But resisting grace has eternal consequences. The book of Hebrews warns about hardening our hearts when we hear God\'s voice. Today is always the day of salvation; tomorrow may be too late. If you\'ve been resisting God\'s grace, soften your heart while there\'s still time. If you\'ve already received His grace, remember that we can also resist His sanctifying grace in specific areas of our lives. Are there places where you\'re saying no to God?',
          reflection: 'Is there any area where you\'re currently resisting God\'s grace? What would full surrender look like in that area?',
          verseReference: 'Acts 7:51',
          verseText: 'Ye stiffnecked and uncircumcised in heart and ears, ye do always resist the Holy Ghost: as your fathers did, so do ye.'
        },
        {
          dayNumber: 15,
          title: 'Day 15: The Throne of Grace',
          content: 'The writer of Hebrews invites us to approach God\'s throne with confidence. Think about what this means: the Creator of the universe, holy and perfect, invites finite, fallen humans to come boldly into His presence. We can do this not because we\'re worthy but because Jesus is our High Priest who sympathizes with our weaknesses. The throne that could be a place of judgment becomes a throne of grace. There we find mercy for our failures and grace for our needs. This doesn\'t mean approaching God flippantly or presumptiously, but rather with confident trust in Christ\'s work on our behalf. We don\'t need to clean ourselves up before coming to God - we come as we are, knowing His grace will meet us there. Prayer becomes not a duty but a delight when we understand we\'re approaching a throne of grace.',
          reflection: 'Do you approach God\'s throne with confidence or fear? What would change if you truly believed you\'re always welcome at the throne of grace?',
          verseReference: 'Hebrews 4:15-16',
          verseText: 'For we have not an high priest which cannot be touched with the feeling of our infirmities; but was in all points tempted like as we are, yet without sin. Let us therefore come boldly unto the throne of grace, that we may obtain mercy, and find grace to help in time of need.'
        },
        {
          dayNumber: 16,
          title: 'Day 16: Grace and the Law',
          content: 'Understanding the relationship between grace and the law is crucial. The law wasn\'t given to save us but to show us our need for salvation. It\'s like a mirror that reveals our face is dirty but can\'t wash it clean. The law exposes sin; grace covers it. Paul explains that the law was our schoolmaster to lead us to Christ. Once faith has come, we\'re no longer under the schoolmaster. This doesn\'t mean the moral standards of the law are irrelevant - stealing is still wrong, lying is still sin. But we don\'t obey out of fear of punishment or hope of earning favor. Instead, grace writes God\'s law on our hearts, creating an internal desire to please Him. The Christian life isn\'t about trying harder to keep rules; it\'s about being transformed by grace to naturally desire what God desires.',
          reflection: 'How do you relate to God - as lawkeeper trying to earn favor or as child resting in grace? What changes when you shift from law to grace?',
          verseReference: 'Galatians 3:24-25',
          verseText: 'Wherefore the law was our schoolmaster to bring us unto Christ, that we might be justified by faith. But after that faith is come, we are no longer under a schoolmaster.'
        },
        {
          dayNumber: 17,
          title: 'Day 17: Falling from Grace',
          content: 'Paul warned the Galatians about "falling from grace" - not losing salvation, but abandoning grace as their operating principle and returning to law-keeping for acceptance. This happens when believers start thinking their standing with God depends on their performance. Suddenly, Christianity becomes exhausting as they try to maintain favor through spiritual activities. Joy fades, replaced by anxiety about measuring up. This isn\'t the abundant life Jesus promised. Falling from grace means switching from trust in Christ\'s work to trust in your own work. The remedy? Return to the gospel. Remember that your relationship with God was established by grace and continues by grace. You\'re not saved by grace then maintained by works. It\'s grace from start to finish. Rest in what Christ has done, not in what you\'re doing.',
          reflection: 'Have you "fallen from grace" by trying to earn God\'s continued favor through performance? How can you return to resting in His grace today?',
          verseReference: 'Galatians 5:4',
          verseText: 'Christ is become of no effect unto you, whosoever of you are justified by the law; ye are fallen from grace.'
        },
        {
          dayNumber: 18,
          title: 'Day 18: The Grace Gift of Salvation',
          content: 'Salvation is called a "gift" precisely because gifts can\'t be earned. If you work for something, it becomes wages, not a gift. God\'s gift of eternal life through Jesus Christ comes without strings attached - nothing owed, nothing required except to receive it by faith. This gift includes forgiveness of all sins, reconciliation with God, adoption as His child, the indwelling Holy Spirit, and secure eternal life. Yet many believers live as though they must keep earning what\'s already been freely given. They exhaust themselves trying to maintain their salvation when Jesus has already secured it completely. Understanding salvation as a gift produces grateful, joyful Christians who serve God out of love, not obligation. You can\'t lose what was given by grace, and you don\'t need to earn what was freely purchased for you.',
          reflection: 'Do you live like salvation is a gift or something you must keep earning? How would your daily life change if you fully embraced salvation as God\'s unlosable gift?',
          verseReference: 'Romans 6:23',
          verseText: 'For the wages of sin is death; but the gift of God is eternal life through Jesus Christ our Lord.'
        },
        {
          dayNumber: 19,
          title: 'Day 19: Multiplied Grace',
          content: 'Peter and Jude both pray that grace would be "multiplied" to believers. This suggests grace isn\'t a one-time deposit but an ongoing multiplication in our experience. As we grow in knowing God, grace multiplies. As we face new challenges, grace multiplies to meet them. As our understanding deepens, grace multiplies to sustain us. This multiplication happens through the knowledge of God and Jesus Christ. The more we know Him, the more grace we experience. It\'s not about accumulating more grace but experiencing more deeply the inexhaustible grace already available. Like tapping into a water main rather than filling a cup - the supply is unlimited; we simply need to position ourselves to receive more. Growth in grace comes through knowing God more intimately.',
          reflection: 'How have you experienced God\'s grace multiplying in your life? What practices help you receive more of His abundant grace?',
          verseReference: '2 Peter 1:2',
          verseText: 'Grace and peace be multiplied unto you through the knowledge of God, and of Jesus our Lord.'
        },
        {
          dayNumber: 20,
          title: 'Day 20: The God of All Grace',
          content: 'Peter calls God "the God of all grace" - a beautiful title emphasizing that grace defines His very nature. All grace finds its source in God. Every form of grace - saving, sustaining, sufficient, sanctifying - flows from Him. There\'s no situation where God runs out of grace to give, no sin too great for His grace to cover, no failure too complete for His grace to redeem. This means we never need to fear approaching God. Yes, we should come with reverence and holy fear, but never with terror that He might reject us. The God of all grace delights in showing mercy. He invented grace, perfected grace in Christ, and pours it out abundantly. Whatever you\'re facing today, the God of all grace has specific grace for that exact need.',
          reflection: 'How does knowing God as "the God of all grace" change how you view Him? What would it look like to fully trust His grace in every area of your life?',
          verseReference: '1 Peter 5:10',
          verseText: 'But the God of all grace, who hath called us unto his eternal glory by Christ Jesus, after that ye have suffered a while, make you perfect, stablish, strengthen, settle you.'
        },
        {
          dayNumber: 21,
          title: 'Day 21: Living Under Grace',
          content: 'Paul declares boldly: "Sin shall not have dominion over you, for you are not under law but under grace." This isn\'t permission to sin - it\'s a promise of power over sin. Under law, sin had dominion because the law could only condemn, not transform. But under grace, we have the Holy Spirit empowering us from within. Grace doesn\'t lower God\'s standards; it provides the means to meet them. The same grace that saved you will sanctify you. It teaches you to say no to ungodliness and yes to righteous living. Grace changes desires, not just behavior. It works from the inside out, transforming hearts before reforming habits. To live under grace means daily acknowledging your dependence on God, receiving fresh forgiveness when you fail, and experiencing His power to grow in holiness. This is the victorious Christian life - not independence from God but complete dependence on His grace. May you walk in this grace daily, grow in this grace continually, and share this grace generously.',
          reflection: 'How does living under grace change your relationship with sin and righteousness? What would total dependence on God\'s grace look like in your daily walk?',
          verseReference: 'Romans 6:14',
          verseText: 'For sin shall not have dominion over you: for ye are not under the law, but under grace.'
        }
      ];

      return [...base7Days, ...expanded14Days];
    }
  },

  template_gospel: {
    title: 'The Gospel',
    description: 'Understand the good news of Jesus Christ',
    getDays: (duration: 7 | 21) => {
      const base7Days: TemplateDay[] = [
        {
          dayNumber: 1,
          title: 'Day 1: The Problem - Sin',
          content: 'The gospel begins with bad news before it brings good news. Humanity has a fundamental problem: sin. Sin isn\'t just mistakes or moral failures; it\'s rebellion against God, falling short of His perfect standard, and loving created things more than our Creator. Every person, from the most moral to the most wicked, has sinned and fails to reflect God\'s glory. This sin separates us from a holy God who cannot overlook evil. The wages of sin is death - not just physical death, but eternal spiritual separation from God. We cannot fix this problem on our own. No amount of good deeds, religious activity, or self-improvement can erase our sin or make us acceptable to God. Like someone drowning who needs rescue, not swimming lessons, we need salvation, not self-help. Understanding the depth of our sin problem is essential to understanding the greatness of the gospel solution. We must recognize we\'re lost before we can be found.',
          reflection: 'Do you truly understand the seriousness of sin? How does recognizing your sin help you appreciate the gospel more deeply?',
          verseReference: 'Romans 3:23',
          verseText: 'For all have sinned, and come short of the glory of God.'
        },
        {
          dayNumber: 2,
          title: 'Day 2: God\'s Character - Holiness and Love',
          content: 'To understand the gospel, we must know God\'s character. He is perfectly holy - utterly pure, completely righteous, with no hint of sin or evil. His holiness demands that sin be punished; justice requires it. Yet God is also perfectly loving - patient, kind, desiring relationship with His creation. These two attributes create a divine dilemma: How can a holy God who must punish sin maintain justice while a loving God who desires relationship shows mercy? How can He be "just and the justifier"? Lesser gods of human invention simply overlook sin or lack the holiness to care, but the true God is both infinitely holy and infinitely loving. The gospel is the brilliant solution to this apparent contradiction. At the cross, God\'s justice and mercy kiss. His holiness is satisfied and His love is displayed in one magnificent act.',
          reflection: 'How does understanding both God\'s holiness and His love deepen your appreciation for the cross? Which attribute do you tend to emphasize more, and what would a better balance look like?',
          verseReference: 'Romans 3:26',
          verseText: 'To declare, I say, at this time his righteousness: that he might be just, and the justifier of him which believeth in Jesus.'
        },
        {
          dayNumber: 3,
          title: 'Day 3: The Solution - Jesus Christ',
          content: 'God\'s answer to our sin problem is Jesus Christ - fully God and fully man. The eternal Son of God took on human flesh, lived a perfect life we couldn\'t live, and died the death we deserved. On the cross, Jesus became our substitute, taking the punishment for our sins so we could receive His righteousness. This is called "substitutionary atonement" - He died in our place. The sinless One was treated as if He were sinful so that sinful ones could be treated as righteous. Three days later, Jesus rose from the dead, proving He had conquered sin, death, and Satan. His resurrection validates everything He claimed and guarantees our future resurrection. Without Jesus, we have no hope. With Jesus, we have complete forgiveness, full acceptance, and eternal life. He is not merely a good teacher or moral example - He is the only Savior, the exclusive way to God.',
          reflection: 'How does Jesus being both fully God and fully man matter for salvation? What does His substitutionary death mean for you personally?',
          verseReference: '1 Corinthians 15:3-4',
          verseText: 'For I delivered unto you first of all that which I also received, how that Christ died for our sins according to the scriptures; And that he was buried, and that he rose again the third day according to the scriptures.'
        },
        {
          dayNumber: 4,
          title: 'Day 4: The Response - Faith and Repentance',
          content: 'The gospel requires a response: faith and repentance. Faith means trusting Christ alone for salvation - not Christ plus your good works, church attendance, or religious heritage. It\'s resting entirely in what Jesus has done, not what you\'re doing. True saving faith involves knowing the gospel intellectually, agreeing it\'s true, and trusting Christ personally for salvation. Repentance means turning from sin toward God. It\'s a change of mind that produces a change of direction. You stop running from God and run to Him instead. Repentance isn\'t cleaning up your life before coming to Christ; it\'s coming to Christ, who then cleans up your life. These aren\'t two separate responses but two sides of the same coin. You can\'t truly turn to Christ without turning from sin, and you can\'t genuinely turn from sin without turning to Christ. The gospel call is "Repent and believe."',
          reflection: 'Have you personally repented and believed in Jesus Christ? If so, when and how? If not, what\'s holding you back from trusting Christ today?',
          verseReference: 'Mark 1:15',
          verseText: 'And saying, The time is fulfilled, and the kingdom of God is at hand: repent ye, and believe the gospel.'
        },
        {
          dayNumber: 5,
          title: 'Day 5: The Result - Justification',
          content: 'When we trust Christ, God declares us righteous - this is justification. It\'s a legal term meaning God the Judge looks at believers and pronounces them "not guilty." More than that, He credits Christ\'s righteousness to our account. Imagine a courtroom: you\'re guilty, the evidence is overwhelming, the punishment is death. But then Someone steps forward, takes your guilt upon Himself, receives your punishment, and transfers His perfect record to you. The Judge declares you righteous based not on your performance but on His. This isn\'t God pretending we\'re righteous when we\'re not; it\'s God declaring us righteous based on Christ\'s work. Justification is complete the moment we believe - there\'s nothing we add to it. We\'re as justified on day one of salvation as we\'ll be in heaven. This produces assurance, peace, and joy.',
          reflection: 'Do you live with the assurance of being fully justified, or do you still try to earn God\'s acceptance? How would your daily life change if you truly believed you\'re declared righteous in Christ?',
          verseReference: 'Romans 5:1',
          verseText: 'Therefore being justified by faith, we have peace with God through our Lord Jesus Christ.'
        },
        {
          dayNumber: 6,
          title: 'Day 6: The Transformation - New Life',
          content: 'The gospel doesn\'t just change our legal standing before God; it transforms us from the inside out. Paul says anyone in Christ is a new creation - the old has gone, the new has come. We receive a new nature, new desires, and new power to live for God. The Holy Spirit comes to dwell within us, making His temple in our hearts. This isn\'t instant perfection - we still struggle with sin - but there\'s a fundamental change in direction. Before salvation, we were slaves to sin; now we\'re free to pursue righteousness. Old pleasures lose their appeal, spiritual things become attractive, and we actually want to obey God. This transformation is progressive - called sanctification - as the Holy Spirit works in us to make us more like Christ. The same gospel that saved us continues to transform us daily.',
          reflection: 'What evidence of transformation do you see in your life since believing the gospel? What areas still need the Holy Spirit\'s transforming work?',
          verseReference: '2 Corinthians 5:17',
          verseText: 'Therefore if any man be in Christ, he is a new creature: old things are passed away; behold, all things are become new.'
        },
        {
          dayNumber: 7,
          title: 'Day 7: The Mission - Sharing the Gospel',
          content: 'Those who\'ve received the gospel are commissioned to share it. We\'re ambassadors for Christ, entrusted with the message of reconciliation. This isn\'t optional - it\'s the natural overflow of experiencing such good news. How can we keep silent about the best news in the universe? Sharing the gospel doesn\'t require special training, just faithfulness. You simply tell people what Christ has done for you and what He offers them. Some will respond, others will reject, but that\'s not your responsibility. Your job is to be a faithful witness, letting the Holy Spirit do the convicting. The gospel is the power of God for salvation - not our eloquence, arguments, or presentation skills. We trust the message itself to do the work. Every believer can share their story of grace and point others to Jesus. Who in your life needs to hear the gospel? Will you share it?',
          reflection: 'Who in your life needs to hear the gospel? What holds you back from sharing it, and how can you overcome those obstacles?',
          verseReference: 'Romans 1:16',
          verseText: 'For I am not ashamed of the gospel of Christ: for it is the power of God unto salvation to every one that believeth; to the Jew first, and also to the Greek.'
        }
      ];

      if (duration === 7) {
        return base7Days;
      }

      // 21-day expanded version includes deeper study of gospel elements
      const expanded14Days: TemplateDay[] = [
        {
          dayNumber: 8,
          title: 'Day 8: Creation and Fall',
          content: 'The gospel story begins in Genesis with creation. God made humanity in His image for relationship with Him. Adam and Eve enjoyed perfect fellowship with their Creator in Eden. But tempted by Satan, they chose to disbelieve God\'s word and disobey His command, eating from the forbidden tree. In that moment, sin entered the world, and everything broke. Death, pain, suffering, and separation from God became humanity\'s reality. Adam and Eve\'s sin wasn\'t just their problem - as our representatives, their rebellion affected all their descendants. We inherit a sin nature from Adam. This is why everyone sins; we\'re born with a natural inclination toward rebellion. Understanding the fall helps us grasp why the world is broken and why we need a Savior. The gospel is God\'s plan to reverse the curse and restore what was lost in Eden.',
          reflection: 'How does understanding the fall help you make sense of the world\'s brokenness? How does seeing sin as inherited help you understand your own struggle with sin?',
          verseReference: 'Romans 5:12',
          verseText: 'Wherefore, as by one man sin entered into the world, and death by sin; and so death passed upon all men, for that all have sinned.'
        },
        {
          dayNumber: 9,
          title: 'Day 9: The Prophecies of Christ',
          content: 'The gospel wasn\'t a backup plan; it was God\'s plan from eternity. Immediately after the fall, God promised a Redeemer who would crush the serpent\'s head. Throughout the Old Testament, prophets foretold details of the coming Messiah: born in Bethlehem, from David\'s line, born of a virgin, rejected by His people, pierced for our transgressions, buried in a rich man\'s tomb, risen from the dead. Jesus fulfilled hundreds of specific prophecies, proving He was the promised Savior. These prophecies show that God was working out His rescue plan throughout history. He didn\'t abandon humanity after the fall but steadily moved toward the cross where sin would be defeated and restoration would begin. The prophecies also give us confidence: if God fulfilled these ancient promises in Christ\'s first coming, we can trust He\'ll fulfill His promises about Christ\'s second coming.',
          reflection: 'How does seeing Jesus fulfill Old Testament prophecy strengthen your faith? What prophecies about His second coming give you hope?',
          verseReference: 'Isaiah 53:5',
          verseText: 'But he was wounded for our transgressions, he was bruised for our iniquities: the chastisement of our peace was upon him; and with his stripes we are healed.'
        },
        // Continue days 10-21 with gospel themes...
        {
          dayNumber: 10,
          title: 'Day 10: The Incarnation',
          content: 'The eternal Son of God took on human flesh - this is the incarnation. John writes that the Word became flesh and dwelt among us. Jesus didn\'t just appear to be human; He became truly human while remaining truly God. This was necessary for salvation. Only a human could represent humanity and die for human sin. Only God could live a perfect life and offer a sacrifice of infinite value. Jesus had to be both. He experienced hunger, thirst, fatigue, and temptation, yet without sin. He knows what it\'s like to be human, to face suffering, to feel pain. This makes Him a sympathetic High Priest who understands our weaknesses. The incarnation shows God\'s amazing love - the Creator became part of His creation to save it.',
          reflection: 'How does Jesus\' full humanity help you relate to Him? How does His full divinity give you confidence in salvation?',
          verseReference: 'John 1:14',
          verseText: 'And the Word was made flesh, and dwelt among us, (and we beheld his glory, the glory as of the only begotten of the Father,) full of grace and truth.'
        },
        {
          dayNumber: 11,
          title: 'Day 11: The Perfect Life',
          content: 'Jesus lived the perfect life we couldn\'t live. For 33 years, He never once sinned - in thought, word, or deed. He kept God\'s law perfectly, fulfilling all righteousness. This wasn\'t just so He could be our sacrifice; it was also so He could provide righteousness for us. We need more than forgiveness; we need righteousness to stand before a holy God. Jesus provides both. His death pays our sin debt, and His perfect life provides the righteousness credited to us. This is the beautiful exchange: our sin for His righteousness. When God looks at believers, He sees Christ\'s perfect obedience. Understanding Jesus\' perfect life shows why salvation must be through Him alone - no one else has lived without sin. Only His righteousness is good enough.',
          reflection: 'Why is Jesus\' perfect life as important as His death? How does knowing His righteousness is credited to you change your standing before God?',
          verseReference: 'Hebrews 4:15',
          verseText: 'For we have not an high priest which cannot be touched with the feeling of our infirmities; but was in all points tempted like as we are, yet without sin.'
        },
        {
          dayNumber: 12,
          title: 'Day 12: The Cross - Substitution',
          content: 'At the cross, Jesus became our substitute. Isaiah prophesied that the Messiah would be "wounded for our transgressions" and "bruised for our iniquities." Jesus took the punishment we deserved so we could receive the blessings He deserved. He was treated as a sinner though He was sinless, so sinners could be treated as righteous though we\'re sinful. God poured out His wrath against sin - not on us, but on Jesus. This satisfies God\'s justice while demonstrating His love. Sin must be punished; at the cross it was, fully and finally. This is penal substitutionary atonement: Jesus substituted for us and bore the penalty for sin. Every sin you\'ve ever committed, every sin you\'ll ever commit - all were placed on Jesus. He paid it all.',
          reflection: 'What does it mean to you personally that Jesus was your substitute? How should understanding this substitution affect how you view sin?',
          verseReference: '1 Peter 3:18',
          verseText: 'For Christ also hath once suffered for sins, the just for the unjust, that he might bring us to God, being put to death in the flesh, but quickened by the Spirit.'
        },
        {
          dayNumber: 13,
          title: 'Day 13: The Cross - Propitiation',
          content: 'Propitiation means satisfying God\'s wrath. God\'s righteous anger against sin was propitiated - satisfied, appeased - at the cross. This doesn\'t mean God was reluctant to save us and had to be convinced. Rather, it means His justice demanded satisfaction, and Jesus provided it. The cross wasn\'t just a display of love; it was a satisfaction of justice. God\'s wrath, which we deserved, was poured out on Jesus instead. Now, for those who trust Christ, there\'s no condemnation. God\'s wrath has been exhausted on Jesus, so there\'s none left for believers. Understanding propitiation helps us see that salvation isn\'t cheap grace or God overlooking sin. Sin was dealt with fully at the cross. Justice was served, wrath was satisfied, and now mercy can flow freely.',
          reflection: 'How does understanding propitiation help you appreciate the cross more? What does it mean that God\'s wrath toward you has been satisfied?',
          verseReference: '1 John 2:2',
          verseText: 'And he is the propitiation for our sins: and not for ours only, but also for the sins of the whole world.'
        },
        {
          dayNumber: 14,
          title: 'Day 14: The Cross - Reconciliation',
          content: 'Through the cross, we\'re reconciled to God - brought from enmity to friendship. Before salvation, we were enemies of God, alienated from Him by our wicked works. The cross removed the barrier between us and God, restoring relationship. Reconciliation is two-way: God\'s attitude toward us changes from wrath to favor, and our attitude toward Him changes from rebellion to surrender. Now we have peace with God instead of being under His judgment. We\'re no longer His enemies but His friends, no longer outcasts but His children. This reconciliation cost Jesus everything. He became a curse so we could be blessed. The gospel message is a message of reconciliation, and we\'re ambassadors calling others to be reconciled to God.',
          reflection: 'What does it mean to you to be reconciled to God? How should your restored relationship with God affect your other relationships?',
          verseReference: '2 Corinthians 5:18-19',
          verseText: 'And all things are of God, who hath reconciled us to himself by Jesus Christ, and hath given to us the ministry of reconciliation; To wit, that God was in Christ, reconciling the world unto himself, not imputing their trespasses unto them; and hath committed unto us the word of reconciliation.'
        },
        {
          dayNumber: 15,
          title: 'Day 15: The Cross - Redemption',
          content: 'Redemption means buying back from slavery. We were slaves to sin, sold under its power, unable to free ourselves. But Jesus paid the ransom price - His precious blood - to redeem us. We were purchased from the slave market of sin and set free. Peter says we were redeemed not with perishable things like silver and gold, but with the precious blood of Christ. The price wasn\'t cheap - it cost Jesus His life. But now we\'re free. We no longer have to serve sin; we\'re liberated to serve God. Understanding redemption helps us see salvation isn\'t just forgiveness but freedom. We\'re not just pardoned criminals but liberated slaves. And having been purchased at such a price, we now belong to Christ. We\'re not our own; we were bought with a price.',
          reflection: 'What does being redeemed from slavery to sin mean for your daily life? How should knowing you were purchased by Christ\'s blood affect your choices?',
          verseReference: '1 Peter 1:18-19',
          verseText: 'Forasmuch as ye know that ye were not redeemed with corruptible things, as silver and gold, from your vain conversation received by tradition from your fathers; But with the precious blood of Christ, as of a lamb without blemish and without spot.'
        },
        {
          dayNumber: 16,
          title: 'Day 16: The Resurrection - Victory Over Death',
          content: 'The resurrection is essential to the gospel. Without it, Christ\'s death would be meaningless. Paul says if Christ hasn\'t been raised, our faith is futile and we\'re still in our sins. But Christ has been raised! Three days after His crucifixion, Jesus walked out of the tomb, defeating death itself. His resurrection proves He is who He claimed to be. It validates His sacrifice and guarantees our future resurrection. Death no longer has the final word. Because He lives, we will live also. The resurrection transforms how believers face death - it\'s not the end but a doorway to eternal life. Every time we gather on Sunday, we celebrate the resurrection. It\'s the foundation of Christian hope and the proof that God accepted Christ\'s sacrifice.',
          reflection: 'How does the resurrection change how you view death? What difference does it make that Jesus is alive today?',
          verseReference: '1 Corinthians 15:17',
          verseText: 'And if Christ be not raised, your faith is vain; ye are yet in your sins.'
        },
        {
          dayNumber: 17,
          title: 'Day 17: The Ascension - Christ\'s Present Ministry',
          content: 'Forty days after His resurrection, Jesus ascended to heaven. This wasn\'t a retreat but an advance to His throne. He went to prepare a place for us and to serve as our High Priest. Right now, Jesus is at the Father\'s right hand interceding for believers. When Satan accuses us, Jesus advocates for us. When we sin, He stands as our defense attorney. When we pray, He presents our petitions to the Father. His ascension means He\'s ruling and reigning, all authority in heaven and earth given to Him. One day He\'ll return to establish His kingdom fully. Until then, He\'s actively involved in the world through the Holy Spirit and His church. The ascension reminds us that Jesus isn\'t just a historical figure; He\'s alive, active, and working today.',
          reflection: 'How does knowing Jesus is interceding for you right now affect your prayer life? What does His reign from heaven mean for your daily struggles?',
          verseReference: 'Hebrews 7:25',
          verseText: 'Wherefore he is able also to save them to the uttermost that come unto God by him, seeing he ever liveth to make intercession for them.'
        },
        {
          dayNumber: 18,
          title: 'Day 18: The Holy Spirit\'s Work',
          content: 'The gospel includes the gift of the Holy Spirit. Jesus promised to send the Spirit to dwell in believers, and on Pentecost that promise was fulfilled. The Spirit convicts the world of sin, righteousness, and judgment. He regenerates dead hearts, bringing spiritual life. He indwells believers permanently - God taking up residence within us. He assures us of our salvation, bears witness that we\'re God\'s children. He empowers us for service and sanctification. He produces fruit in our lives - love, joy, peace, patience, and more. He gives spiritual gifts for building up the church. The Spirit makes the gospel effective in our lives. Without Him, the gospel would just be historical facts. With Him, it becomes living power transforming us from the inside out.',
          reflection: 'How have you experienced the Holy Spirit\'s work in your life? In what areas do you need to depend more on His power?',
          verseReference: 'Romans 8:16',
          verseText: 'The Spirit itself beareth witness with our spirit, that we are the children of God.'
        },
        {
          dayNumber: 19,
          title: 'Day 19: Adoption as Sons',
          content: 'The gospel brings not just forgiveness but family. We\'re adopted as God\'s children, given all the rights and privileges of sons and daughters. This is staggering - the Creator of the universe calls us His children! We can cry "Abba, Father" - an intimate term like "Daddy." We\'re heirs of God and co-heirs with Christ, inheriting everything Christ inherits. This adoption is permanent; God doesn\'t disown His children. It means we have a Father who loves us perfectly, cares for us completely, and protects us eternally. We belong. We\'re wanted. We\'re home. Understanding adoption shapes our identity. We\'re not just forgiven sinners; we\'re beloved children. This produces security, confidence, and gratitude.',
          reflection: 'How does being adopted by God affect your sense of identity and security? How should knowing you\'re God\'s child influence your relationship with Him?',
          verseReference: 'Galatians 4:4-5',
          verseText: 'But when the fulness of the time was come, God sent forth his Son, made of a woman, made under the law, To redeem them that were under the law, that we might receive the adoption of sons.'
        },
        {
          dayNumber: 20,
          title: 'Day 20: Eternal Security',
          content: 'Those who truly believe the gospel are eternally secure. Jesus said no one can snatch His sheep from His hand. Paul declared nothing can separate believers from God\'s love. This isn\'t a license to sin but a foundation for assurance. If salvation depended on maintaining our faithfulness, we\'d all be lost. But it depends on Christ\'s faithfulness, which never fails. God began a good work in us and will complete it. Our salvation is as secure as Christ\'s sacrifice is sufficient - completely. This doesn\'t mean we can live however we want. Those truly saved will persevere in faith, evidencing genuine conversion. But our perseverance is itself a gift of grace. We stand by faith, kept by God\'s power. Eternal security produces not carelessness but confidence and joy.',
          reflection: 'Do you have assurance of your salvation? What evidence of genuine faith do you see in your life?',
          verseReference: 'John 10:28-29',
          verseText: 'And I give unto them eternal life; and they shall never perish, neither shall any man pluck them out of my hand. My Father, which gave them me, is greater than all; and no man is able to pluck them out of my Father\'s hand.'
        },
        {
          dayNumber: 21,
          title: 'Day 21: The Gospel\'s Continuing Power',
          content: 'The gospel isn\'t just how we begin the Christian life; it\'s how we continue it. We preach the gospel to ourselves daily, reminding ourselves of what Christ has done. The same gospel that saved us sanctifies us. It motivates our obedience, comforts us in suffering, and assures us in doubt. The gospel addresses every area of life. When we fail, the gospel offers forgiveness. When we succeed, the gospel keeps us humble. When we\'re afraid, the gospel brings peace. When we face death, the gospel promises life. We never outgrow our need for the gospel; we grow deeper into it. As we mature, we don\'t leave the gospel behind - we see more layers of its beauty and power. The gospel is the power of God for salvation and the message we\'ll celebrate for eternity. May we never tire of hearing it, believing it, and sharing it.',
          reflection: 'How do you need the gospel today? How can you make it your practice to remind yourself of the gospel daily?',
          verseReference: 'Romans 1:16',
          verseText: 'For I am not ashamed of the gospel of Christ: for it is the power of God unto salvation to every one that believeth; to the Jew first, and also to the Greek.'
        }
      ];

      return [...base7Days, ...expanded14Days];
    }
  },

  // Additional templates follow similar pattern...
  template_prayer_fasting: {
    title: 'Prayer & Fasting',
    description: 'Deepen your communion with God through prayer and fasting',
    getDays: (duration: 7 | 21) => {
      const days: TemplateDay[] = [
        {
          dayNumber: 1,
          title: 'Day 1: The Purpose of Prayer',
          content: 'Prayer is communion with God - speaking to Him and listening for His voice. It\'s not merely a religious duty but a relational privilege, accessing the throne room of the universe. Jesus modeled prayer, often withdrawing to solitary places to pray. He taught that prayer should be simple, sincere, and focused on God\'s will rather than our wants. Prayer aligns our hearts with God\'s purposes, transforms our perspective, and invites His power into our circumstances. It\'s where we bring our requests, confess our sins, worship His greatness, and intercede for others. Prayer isn\'t about getting God to do what we want, but about wanting what God wants and partnering with Him in His work.',
          reflection: 'What is your current prayer life like? What barriers keep you from deeper prayer?',
          verseReference: 'Matthew 6:6',
          verseText: 'But thou, when thou prayest, enter into thy closet, and when thou hast shut thy door, pray to thy Father which is in secret; and thy Father which seeth in secret shall reward thee openly.'
        },
        {
          dayNumber: 2,
          title: 'Day 2: Jesus Our Example',
          content: 'Jesus, though fully God, consistently withdrew to pray. Before major decisions, He prayed. Under stress, He prayed. In moments of joy, He prayed. If the Son of God needed prayer, how much more do we? His prayers weren\'t lengthy religious speeches but intimate conversations with the Father. He prayed early in the morning, late at night, and sometimes all night. Prayer was His lifeline, His source of strength, His means of staying aligned with the Father\'s will. In the garden of Gethsemane, we see prayer at its most raw and honest - Jesus expressing His emotions, His desires, yet ultimately surrendering to the Father\'s will.',
          reflection: 'What can you learn from Jesus\' prayer life? How can you make prayer more central to your daily routine?',
          verseReference: 'Mark 1:35',
          verseText: 'And in the morning, rising up a great while before day, he went out, and departed into a solitary place, and there prayed.'
        },
        {
          dayNumber: 3,
          title: 'Day 3: The Power of Fasting',
          content: 'Fasting is voluntarily abstaining from food (or other things) to focus on God. It\'s not a way to earn God\'s favor or manipulate Him, but a means of humbling ourselves, heightening our spiritual sensitivity, and demonstrating the seriousness of our seeking. When we fast, we exchange physical satisfaction for spiritual nourishment. The hunger pangs become reminders to pray. Fasting breaks the power of the flesh and increases dependence on God. Jesus expected His followers to fast - He said "when you fast," not "if you fast." Throughout Scripture, fasting accompanied repentance, mourning, intercession, and seeking God\'s direction.',
          reflection: 'Have you ever fasted? What might God be calling you to fast from to draw nearer to Him?',
          verseReference: 'Matthew 6:17-18',
          verseText: 'But thou, when thou fastest, anoint thine head, and wash thy face; That thou appear not unto men to fast, but unto thy Father which is in secret: and thy Father, which seeth in secret, shall reward thee openly.'
        },
        {
          dayNumber: 4,
          title: 'Day 4: Persistent Prayer',
          content: 'Jesus taught about persistent prayer through the parable of the persistent widow. Keep asking, keep seeking, keep knocking. God isn\'t deaf to our prayers; rather, persistence develops our faith, refines our requests, and prepares us to receive what we\'re asking for. Sometimes God delays answers to test our faith, deepen our dependence, or align our hearts with His timing. Daniel prayed for 21 days before receiving an answer - persistent, faithful prayer. Elijah prayed seven times for rain. Hannah prayed year after year for a son. Persistent prayer isn\'t nagging God but demonstrating that we believe He hears and will answer according to His perfect wisdom.',
          reflection: 'What have you stopped praying for that God might want you to persist in? How can you maintain faith while waiting for answers?',
          verseReference: 'Luke 18:1',
          verseText: 'And he spake a parable unto them to this end, that men ought always to pray, and not to faint.'
        },
        {
          dayNumber: 5,
          title: 'Day 5: Praying in the Spirit',
          content: 'When we don\'t know how to pray, the Holy Spirit intercedes for us with groanings too deep for words. Prayer in the Spirit means praying according to God\'s will, guided and empowered by the Spirit. It involves more than our intellect - it engages our spirit in communion with God\'s Spirit. The Spirit helps us pray for things we wouldn\'t know to pray for, in ways that align with God\'s purposes. This kind of prayer requires yielding control, listening for God\'s direction, and being sensitive to His leading. It moves beyond our agenda to God\'s agenda.',
          reflection: 'Do you make space in prayer to listen for the Spirit\'s leading? How can you become more sensitive to the Spirit\'s promptings?',
          verseReference: 'Romans 8:26',
          verseText: 'Likewise the Spirit also helpeth our infirmities: for we know not what we should pray for as we ought: but the Spirit itself maketh intercession for us with groanings which cannot be uttered.'
        },
        {
          dayNumber: 6,
          title: 'Day 6: Corporate Prayer',
          content: 'There\'s unique power when believers gather to pray together. Jesus promised that where two or three gather in His name, He\'s present in a special way. The early church devoted themselves to prayer together, and God worked powerfully. Corporate prayer multiplies faith, encourages persistence, and demonstrates unity. When we pray together, we bear one another\'s burdens, celebrate one another\'s victories, and stand united against spiritual opposition. It also protects us from self-centered praying as we learn to intercede for others and see beyond our own needs.',
          reflection: 'Are you part of a praying community? How can you contribute to or initiate corporate prayer?',
          verseReference: 'Matthew 18:20',
          verseText: 'For where two or three are gathered together in my name, there am I in the midst of them.'
        },
        {
          dayNumber: 7,
          title: 'Day 7: A Life of Prayer',
          content: 'Paul instructs us to "pray without ceasing" - not constant formal prayer but living in continual awareness of God\'s presence and ongoing communication with Him. Prayer becomes less about scheduled times and more about a lifestyle of God-consciousness. We bring everything to Him - joys, frustrations, decisions, fears, gratitude. This doesn\'t replace dedicated prayer times but extends prayer throughout every moment. Brother Lawrence called it "practicing the presence of God." It transforms ordinary activities into opportunities for communion with God. This is the goal: a life so integrated with God that prayer becomes as natural as breathing.',
          reflection: 'What would it look like to make prayer your default response to life? How can you cultivate continual awareness of God\'s presence?',
          verseReference: '1 Thessalonians 5:17',
          verseText: 'Pray without ceasing.'
        }
      ];
      return duration === 7 ? days.slice(0, 7) : days;
    }
  },

  template_love_compassion: {
    title: 'Love & Compassion',
    description: 'Living out Christ\'s love in the world',
    getDays: (duration: 7 | 21) => {
      const days: TemplateDay[] = [
        {
          dayNumber: 1,
          title: 'Day 1: God\'s Love for Us',
          content: 'God\'s love is the foundation of everything. John declares "God is love" - it\'s His very nature. His love isn\'t based on our worthiness but flows from His character. While we were still sinners, Christ died for us, demonstrating incomprehensible love. This love is patient, kind, never ending. It pursued us when we were running from Him. God\'s love isn\'t sentimental emotion but committed action - He gave His Son. Nothing can separate us from this love - not failure, sin, circumstances, or even death. Understanding how deeply God loves us transforms how we view ourselves and others. We can love because He first loved us.',
          reflection: 'How have you experienced God\'s love personally? How does His love for you motivate you to love others?',
          verseReference: '1 John 4:19',
          verseText: 'We love him, because he first loved us.'
        },
        {
          dayNumber: 2,
          title: 'Day 2: The Greatest Commandment',
          content: 'When asked about the greatest commandment, Jesus replied: Love God with all your heart, soul, mind, and strength, and love your neighbor as yourself. All other commands hang on these two. Loving God is primary - from this flows all other love. We can\'t truly love others without first being rooted in God\'s love. This love involves our entire being: emotions (heart), will (soul), intellect (mind), and actions (strength). It\'s not partial or compartmentalized but total devotion. Loving our neighbor means treating others with the same care, dignity, and compassion we desire for ourselves.',
          reflection: 'In what ways do you love God with your whole being? Who is your "neighbor" that God is calling you to love?',
          verseReference: 'Mark 12:30-31',
          verseText: 'And thou shalt love the Lord thy God with all thy heart, and with all thy soul, and with all thy mind, and with all thy strength: this is the first commandment. And the second is like, namely this, Thou shalt love thy neighbour as thyself.'
        },
        {
          dayNumber: 3,
          title: 'Day 3: Love in Action',
          content: 'John warns that claiming to love God while hating others makes us liars. Real love isn\'t mere words but action and truth. The Good Samaritan exemplifies love in action - crossing cultural barriers, sacrificing time and resources, caring for someone who couldn\'t repay. Love sees needs and responds. It\'s inconvenient, costly, and counter-cultural. James says faith without works is dead; similarly, love without action is empty. We prove our love by what we do, not just what we say. True love rolls up its sleeves and serves.',
          reflection: 'Where is God calling you to demonstrate love through action? What barriers prevent you from loving sacrificially?',
          verseReference: '1 John 3:18',
          verseText: 'My little children, let us not love in word, neither in tongue; but in deed and in truth.'
        },
        {
          dayNumber: 4,
          title: 'Day 4: Loving the Unlovable',
          content: 'Jesus commands us to love our enemies and pray for those who persecute us. This is radical, counter-intuitive love that reflects God\'s character. Anyone can love those who love them back. But loving those who hurt us, who oppose us, who make life difficult - that requires supernatural grace. Jesus modeled this on the cross: "Father, forgive them." Stephen prayed for those stoning him. This doesn\'t mean accepting abuse or lacking boundaries, but refusing to return evil for evil. It means genuinely desiring their good and redemption.',
          reflection: 'Who do you find difficult to love? How can you pray for and bless those who have hurt you?',
          verseReference: 'Matthew 5:44',
          verseText: 'But I say unto you, Love your enemies, bless them that curse you, do good to them that hate you, and pray for them which despitefully use you, and persecute you.'
        },
        {
          dayNumber: 5,
          title: 'Day 5: Compassion That Moves',
          content: 'Jesus was repeatedly "moved with compassion." He didn\'t just feel sympathy but was deeply moved to action. Compassion sees suffering and responds. It enters into another\'s pain rather than remaining distant. The word for compassion in Hebrew suggests a deep stirring in one\'s innermost being. True compassion is uncomfortable - it disrupts our comfort and convenience. Jesus touched lepers, healed on the Sabbath, welcomed sinners. Compassion often requires us to break social norms, challenge religious tradition, and prioritize people over rules. It\'s love encountering need and refusing to walk away.',
          reflection: 'What suffering around you is God calling you to notice and respond to? What prevents you from acting on compassion?',
          verseReference: 'Matthew 9:36',
          verseText: 'But when he saw the multitudes, he was moved with compassion on them, because they fainted, and were scattered abroad, as sheep having no shepherd.'
        },
        {
          dayNumber: 6,
          title: 'Day 6: Sacrificial Love',
          content: 'Greater love has no one than this: to lay down one\'s life for friends. Jesus defined love not by feelings but by sacrifice. He loved us by giving His life. Paul says husbands should love wives as Christ loved the church - giving Himself up for her. Sacrificial love prioritizes others\' good above personal comfort, preferences, or even rights. It\'s the mother who loses sleep for her child, the friend who drops everything in crisis, the believer who shares resources sacrificially. This love costs something. It\'s measured not by what we say but by what we\'re willing to sacrifice.',
          reflection: 'What is God asking you to sacrifice for others? Where do you need to die to self to truly love?',
          verseReference: 'John 15:13',
          verseText: 'Greater love hath no man than this, that a man lay down his life for his friends.'
        },
        {
          dayNumber: 7,
          title: 'Day 7: Love Never Fails',
          content: 'In Paul\'s famous love chapter, he describes love\'s characteristics: patient, kind, not envious or boastful, not proud, not rude, not self-seeking, not easily angered, keeps no record of wrongs, rejoices in truth, protects, trusts, hopes, perseveres. And then the climax: love never fails. While prophecies will cease, tongues will be stilled, knowledge will pass away, love remains. It\'s eternal, unchanging, ultimate. In eternity, only love will matter - how we loved God and others. Everything else fades. Love is the currency of heaven, the language of eternity, the measure by which our lives will be evaluated.',
          reflection: 'Which characteristic of love from 1 Corinthians 13 do you need to grow in? How can you make love your ultimate pursuit?',
          verseReference: '1 Corinthians 13:8',
          verseText: 'Charity never faileth: but whether there be prophecies, they shall fail; whether there be tongues, they shall cease; whether there be knowledge, it shall vanish away.'
        }
      ];
      return duration === 7 ? days.slice(0, 7) : days;
    }
  },

  template_faith_action: {
    title: 'Faith in Action',
    description: 'Putting your faith into practice',
    getDays: (duration: 7 | 21) => {
      const days: TemplateDay[] = [
        {
          dayNumber: 1,
          title: 'Day 1: Faith That Works',
          content: 'James declares that faith without works is dead. True saving faith produces action. We\'re not saved by works, but we\'re saved for good works, which God prepared beforehand for us to walk in. Faith isn\'t just intellectual agreement but living trust that transforms behavior. Abraham believed God and it was credited as righteousness, but his faith was demonstrated when he obeyed God\'s call. Rahab\'s faith was shown in her actions protecting the spies. Our faith becomes visible through what we do. If someone claims faith but their life shows no evidence of transformation, James questions whether real faith exists at all.',
          reflection: 'What evidence of living faith do you see in your life? Where is God calling you to put faith into action?',
          verseReference: 'James 2:17',
          verseText: 'Even so faith, if it hath not works, is dead, being alone.'
        },
        {
          dayNumber: 2,
          title: 'Day 2: Obedience: Faith\'s Response',
          content: 'Jesus asked, "Why do you call me Lord and don\'t do what I say?" True faith results in obedience. Not legalistic rule-keeping, but loving response to God\'s authority. Jesus said if we love Him, we\'ll obey His commands. Obedience demonstrates that we trust God knows what\'s best. When God speaks, faith doesn\'t negotiate, rationalize, or delay - it obeys. Noah built an ark on dry land. Abraham left everything for an unknown destination. Mary said, "Let it be according to Your word." Obedience is faith in motion, trusting God enough to do what He says even when it doesn\'t make sense.',
          reflection: 'What is God asking you to obey that you\'ve been resisting? What makes obedience difficult in that area?',
          verseReference: 'Luke 6:46',
          verseText: 'And why call ye me, Lord, Lord, and do not the things which I say?'
        },
        {
          dayNumber: 3,
          title: 'Day 3: Serving Others',
          content: 'Jesus came not to be served but to serve, and to give His life as a ransom for many. He washed His disciples\' feet - the task of the lowest servant. True greatness in God\'s kingdom is measured by service, not status. We\'re called to use our gifts to serve others, as good stewards of God\'s grace. Service is faith in action, putting others\' needs above our comfort. It means practical help: feeding the hungry, caring for the sick, welcoming the stranger, visiting prisoners. It\'s inconvenient, often invisible, and requires humility. But it\'s where faith becomes tangible.',
          reflection: 'Who can you serve this week? What prevents you from serving more freely?',
          verseReference: 'Mark 10:45',
          verseText: 'For even the Son of man came not to be ministered unto, but to minister, and to give his life a ransom for many.'
        },
        {
          dayNumber: 4,
          title: 'Day 4: Sharing Your Faith',
          content: 'We\'re ambassadors for Christ, given the ministry of reconciliation. Faith that stays silent isn\'t fully living. Jesus commissioned us to make disciples, teaching others what He taught us. Peter says always be ready to give a reason for the hope we have. Sharing faith doesn\'t require eloquence or theological expertise - just honesty about what God has done in our lives. It\'s invitation, not argument. We plant seeds, water them with prayer, and trust God for growth. Some will reject the message, but our job is faithful witness, not guaranteed results.',
          reflection: 'When did you last share your faith with someone? What fears hold you back from witnessing?',
          verseReference: '2 Corinthians 5:20',
          verseText: 'Now then we are ambassadors for Christ, as though God did beseech you by us: we pray you in Christ\'s stead, be ye reconciled to God.'
        },
        {
          dayNumber: 5,
          title: 'Day 5: Generous Living',
          content: 'God loves a cheerful giver. Generosity is faith expressed tangibly - trusting that God will provide when we give from our resources. Jesus watched people giving offerings and noticed the widow\'s two coins. She gave everything, trusting God completely. Generosity isn\'t about the amount but the attitude and sacrifice. It acknowledges that everything we have comes from God. Hoarding reveals trust in wealth rather than God. Giving demonstrates faith that God is our provider. It breaks money\'s grip on our hearts and opens our hands to bless others.',
          reflection: 'How generous are you with your time, talents, and treasure? What would faith-filled generosity look like in your life?',
          verseReference: '2 Corinthians 9:7',
          verseText: 'Every man according as he purposeth in his heart, so let him give; not grudgingly, or of necessity: for God loveth a cheerful giver.'
        },
        {
          dayNumber: 6,
          title: 'Day 6: Standing for Truth',
          content: 'Daniel purposed in his heart not to defile himself, even when it meant risking the king\'s wrath. His three friends refused to bow to idols, saying "our God is able to deliver us, but even if He doesn\'t, we won\'t serve your gods." Faith sometimes means standing alone for truth when everyone else compromises. It means speaking up for justice even when it\'s unpopular. It means refusing to participate in evil even when it costs us. The world needs believers whose faith isn\'t just private spirituality but public conviction that shapes how we live.',
          reflection: 'Where is God calling you to take a stand? What compromise is He asking you to refuse?',
          verseReference: 'Daniel 1:8',
          verseText: 'But Daniel purposed in his heart that he would not defile himself with the portion of the king\'s meat, nor with the wine which he drank: therefore he requested of the prince of the eunuchs that he might not defile himself.'
        },
        {
          dayNumber: 7,
          title: 'Day 7: Persevering in Trials',
          content: 'James says to count it all joy when facing trials, because testing produces perseverance. Faith isn\'t proven when life is easy but when circumstances are hard and we keep trusting anyway. Job lost everything but refused to curse God. Paul rejoiced in prison. The early church sang hymns facing martyrdom. This isn\'t denying pain or pretending everything is fine. It\'s choosing to trust God\'s goodness when you can\'t see His plan. It\'s continuing to obey when obedience is costly. Perseverance proves faith is real - not perfect, but genuine.',
          reflection: 'What trial is testing your faith right now? How can you demonstrate trust in God through this difficulty?',
          verseReference: 'James 1:2-3',
          verseText: 'My brethren, count it all joy when ye fall into divers temptations; Knowing this, that the trying of your faith worketh patience.'
        }
      ];
      return duration === 7 ? days.slice(0, 7) : days;
    }
  }
};

// Export template metadata for UI display
export const TEMPLATE_OPTIONS = [
  {
    id: 'template_grace',
    title: 'Understanding Grace',
    description: 'Explore God\'s unmerited favor and transforming love'
  },
  {
    id: 'template_gospel',
    title: 'The Gospel',
    description: 'Understand the good news of Jesus Christ'
  },
  {
    id: 'template_prayer_fasting',
    title: 'Prayer & Fasting',
    description: 'Deepen your communion with God'
  },
  {
    id: 'template_love_compassion',
    title: 'Love & Compassion',
    description: 'Living out Christ\'s love in the world'
  },
  {
    id: 'template_faith_action',
    title: 'Faith in Action',
    description: 'Putting your faith into practice'
  }
];
