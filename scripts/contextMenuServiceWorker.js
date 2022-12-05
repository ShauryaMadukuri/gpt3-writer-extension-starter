const getKey = () => {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(['openai-key'], (result) => {
      if (result['openai-key']) {
        const decodedKey = atob(result['openai-key']);
        resolve(decodedKey);
      }
    });
  });
};

//sends a message to DOM
const sendMessage = (content) => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0].id;

    chrome.tabs.sendMessage(
      activeTab,
      { message: 'inject', content },
      (response) => {
        if (response.status === 'failed') {
          console.log('injection failed.');
        }
      }
    );
  });
};


const generate = async (prompt) => {
  const key = await getKey();
  const url = 'https://api.openai.com/v1/completions';
	
  const completionResponse = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: 'text-davinci-003',
      prompt: prompt,
      max_tokens: 256,
      temperature: 0.7,
    }),
  });
	

  const completion = await completionResponse.json();
  return completion.choices.pop();
}



const generateCompletionAction = async (info) => {
	try {
    const selectionText  = info;
    const basePromptPrefix =
    `Write the introduction of the poem about ${selectionText}.
    Introduction:
     `;

    const baseCompletion = await generate(`${basePromptPrefix}`);

    const secondPrompt = 
  `
  Take the introduction and  generate a poem about the following topic:
  basic idea of the poem: ${selectionText}
  
  Introduction: 
  ${baseCompletion.text}

  Poem:

  `
  const secondPromptCompletion = await generate(`${secondPrompt}`);
  
  // Send the output when we're all done
  sendMessage(secondPromptCompletion.text);

 
  } catch (error) {
    console.log(error);

    sendMessage(error.toString());
  }
};


// Don't touch this
chrome.contextMenus.create({
  id: 'context-run',
  title: 'Generate Poem',
  contexts: ['selection'],
});
  
 
chrome.contextMenus.onClicked.addListener(generateCompletionAction);