document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // Add event listener for submitting the form 
  document.querySelector('#compose-form').addEventListener('submit', send_email); 

  // By default, load the inbox
  load_mailbox('inbox');
});

function view_email(id,mailbox){
  console.log(id);
  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {
      if(!email.read){
        fetch(`/emails/${email.id}`, {
          method: 'PUT',
          body: JSON.stringify({
              read: true
          })
        })
      }
      // Print email
      console.log(email);
      document.querySelector('#emails-view').style.display = 'none';
      document.querySelector('#compose-view').style.display = 'none';
      document.querySelector('#view-inside-email').style.display = 'block';

      document.querySelector('#view-inside-email').innerHTML = `
          <h6><b> From: </b>${email.sender} </h6>
          <h6><b> To: </b>${email.recipients} </h6>
          <h6><b> Subject: </b>${email.subject} </h6>
          <h6><b> Timestamp: </b>${email.timestamp} </h6>  
          <hr>
          <p>${email.body}</p>
      `;
      // reply email
      const reply = document.createElement('button');
      reply.innerHTML = 'Reply';
      reply.className = "btn btn-success";
      reply.addEventListener('click', function() {
          console.log('This element has been clicked!');
          compose_email();
          let replySubject = email.subject;
          let replyBody = `On ${email.timestamp} ${email.sender} wrote: ${email.body}\n`;

          if(replySubject.split(" ",1)[0] != "Re:"){
            replySubject = "Re: " + replySubject;
            
          }
          document.querySelector('#compose-recipients').value = email.sender;
          document.querySelector('#compose-subject').value = replySubject;
          document.querySelector('#compose-body').value = replyBody;
      });
      document.querySelector('#view-inside-email').append(reply);

      if(mailbox != 'sent'){
        // archive and unarchive email
        const archive = document.createElement('button');
        archive.innerHTML = email.archived ? "Unarchive": "Archive";
        archive.className = email.archived ? "btn btn-warning": "btn btn-secondary";
        archive.addEventListener('click', function() {
            
            fetch(`/emails/${email.id}`, {
              method: 'PUT',
              body: JSON.stringify({
                  archived: email.archived ? false: true
              })
            })
            .then(() => load_mailbox('inbox'))
            
        });
        document.querySelector('#view-inside-email').append(archive);
      }

});
}

function send_email(event)
{
  event.preventDefault();
  // store the composition fields
  const recipients = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;

  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        recipients: recipients,
        subject: subject,
        body: "\n \t" + body
    })
  })
  .then(response => response.json())
  .then(result => {
      // Print result
      console.log(result);
      //load the user's sent box
      load_mailbox('sent');
  });


}

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#view-inside-email').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#view-inside-email').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
      // Create new div for each email and append it to the #emails-view
      emails.forEach(currentMail => {
        console.log(currentMail);

        const newMail = document.createElement('div');

        // if the mail is read; background is gray, if not; white
        newMail.className = currentMail.read ? "list-group-item list-group-item-action list-group-item-secondary": "list-group-item list-group-item-action";
        if(mailbox != 'sent'){
          newMail.innerHTML = `
          <h6><b> ${currentMail.sender} </b> ${currentMail.subject} </h6>    
          <h6 align="right">${currentMail.timestamp} </h6>
          `;

        }
        else{
          newMail.innerHTML = `
          <h6><b>${currentMail.recipients} </b> ${currentMail.subject}</h6>
          <h6 align="right">${currentMail.timestamp} </h6>
          `;

        }
        
        newMail.addEventListener('click', () => view_email(currentMail.id,mailbox));

        document.querySelector('#emails-view').append(newMail);
      
        // put Unarchive button to the Archive mailbox
        if(currentMail.archived && mailbox==='archive'){
          const unArchiveButton = document.createElement('button');
          unArchiveButton.innerHTML = "UnArchive";
          unArchiveButton.className = "btn btn-warning btn-sm me-md-2";
          unArchiveButton.addEventListener('click', function() {
              
              fetch(`/emails/${currentMail.id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    archived: false,
                })
              })
              .then(() => load_mailbox('inbox'))
          });
          document.querySelector('#emails-view').append(unArchiveButton);
        }
        

       
      });
      
      // ... do something else with emails ...
  });

}