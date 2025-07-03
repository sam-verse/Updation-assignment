/** @ts-nocheck */
import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { X, MessageCircle, User, Bot } from 'lucide-react';
import '../../index.css';
import useStore from '../../store/useStore';

// Helper: fuzzy name match
function findEmployeeByName(employees, name) {
  if (!name) return null;
  name = name.trim().toLowerCase().replace(/^(mr|mrs|ms|dr|miss|prof)\.?\s+/i, '');
  let emp = employees.find(emp => emp.name.toLowerCase() === name);
  if (emp) return emp;
  emp = employees.find(emp => emp.name.toLowerCase().includes(name));
  if (emp) return emp;
  const first = name.split(' ')[0];
  emp = employees.find(emp => emp.name.toLowerCase().startsWith(first));
  return emp || null;
}
function getManager(employees, employee) {
  if (!employee || !employee.managerId) return null;
  return employees.find(emp => emp.id === employee.managerId);
}
function getTeam(employees, manager) {
  if (!manager) return [];
  return employees.filter(emp => emp.managerId === manager.id);
}

// Forward ref to allow parent to send messages
const Chatbot = forwardRef((props, ref) => {
  const { showHint } = props;
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Hi! I am your assistant. Ask me about employees, teams, or anything about your org chart!' }
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const [pendingEmployee, setPendingEmployee] = useState(null);
  const [pendingMessageIdx, setPendingMessageIdx] = useState(null);

  // Always use the latest employees from the store
  const employees = useStore(state => state.employees);

  // Allow parent to send messages
  useImperativeHandle(ref, () => ({
    sendBotMessage: (text) => {
      setMessages(msgs => [...msgs, { sender: 'bot', text }]);
      setOpen(true);
    }
  }));

  useEffect(() => {
    if (open && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open]);

  // Enhanced Q&A logic
  function answerQuestion(question) {
    if (employees.length === 0) return "Sorry, I can't access employee data right now.";
    const q = question.toLowerCase().trim();
    // Small talk/greetings
    if (["hi", "hello", "hey", "hii", "heyy", "good morning", "good afternoon", "good evening"].some(greet => q === greet)) {
      return "Hello! How can I help you with your organization or employees today?";
    }
    if (q.includes("how are you")) {
      return "I'm just a bot, but I'm here to help you with anything about your org chart!";
    }
    if (q.includes("thank you") || q.includes("thanks")) {
      return "You're welcome! Let me know if you have more questions.";
    }
    if (q === 'help') {
      return `<b>Here are some things you can ask me:</b><br/><ul style='padding-left:1.2em;'>
        <li>Who is [name]?</li>
        <li>Who is in the [team] team?</li>
        <li>Who manages [name]?</li>
        <li>Show team under [name]</li>
        <li>What is [name]'s email?</li>
        <li>What is [name]'s phone?</li>
        <li>What is [name]'s department/team?</li>
        <li>What is [name]'s title/role/position?</li>
        <li>Who reports to [name]?</li>
        <li>Who is the [title]?</li>
        <li>Who is [name] reporting to?</li>
        <li>List all employees</li>
      </ul>`;
    }
    // If user types only a name (with or without prefix), show choices if a match is found and the input is not a question
    const empOnly = findEmployeeByName(employees, question);
    if (
      empOnly &&
      !q.match(/\b(who|what|show|list|is|does|are|team|manager|email|phone|department|title|role|position|reports|reporting)\b|\?/)
    ) {
      setPendingEmployee(empOnly);
      return { type: 'choice', name: empOnly.name };
    }
    // Who manages [name]?
    let match = q.match(/who\s+manages\s+([a-z\s]+)/i);
    if (match) {
      const name = match[1].trim();
      const emp = findEmployeeByName(employees, name);
      if (emp) {
        const mgr = getManager(employees, emp);
        if (mgr) return `${emp.name} is managed by ${mgr.name} (${mgr.title || ''}).`;
        return `${emp.name} does not have a manager.`;
      }
      return `I couldn't find an employee named "${name}".`;
    }
    // Show team under [name]
    match = q.match(/show\s+(?:me\s+)?(?:the\s+)?team\s+(?:under|of|for)\s+([a-z\s]+)/i);
    if (match) {
      const name = match[1].trim();
      const mgr = findEmployeeByName(employees, name);
      if (mgr) {
        const team = getTeam(employees, mgr);
        if (team.length > 0) {
          return `Team under ${mgr.name}:\n` + team.map(e => `- ${e.name} (${e.title || ''})`).join('\n');
        }
        return `${mgr.name} does not manage anyone.`;
      }
      return `I couldn't find an employee named "${name}".`;
    }
    // What is [name]'s email?
    match = q.match(/what\s+is\s+([a-z\s]+)'?s?\s+email\??/i);
    if (match) {
      const name = match[1].trim();
      const emp = findEmployeeByName(employees, name);
      if (emp && emp.email) return `${emp.name}'s email is ${emp.email}`;
      if (emp) return `I don't have an email for ${emp.name}.`;
      return `I couldn't find an employee named "${name}".`;
    }
    // What is [name]'s phone/number/contact?
    match = q.match(/what\s+is\s+([a-z\s]+)'?s?\s+(phone|number|contact)\??/i);
    if (match) {
      const name = match[1].trim();
      const emp = findEmployeeByName(employees, name);
      if (emp && emp.phone) return `${emp.name}'s phone is ${emp.phone}`;
      if (emp) return `I don't have a phone number for ${emp.name}.`;
      return `I couldn't find an employee named "${name}".`;
    }
    // What is [name]'s department/team?
    match = q.match(/what\s+is\s+([a-z\s]+)'?s?\s+(department|team)\??/i);
    if (match) {
      const name = match[1].trim();
      const emp = findEmployeeByName(employees, name);
      if (emp && emp.team) return `${emp.name} is in the ${emp.team} team.`;
      if (emp) return `I don't have a team/department for ${emp.name}.`;
      return `I couldn't find an employee named "${name}".`;
    }
    // Who is in [team/department]?
    match = q.match(/who\s+is\s+in\s+the?\s+([a-z\s]+)\s+(team|department)/i);
    if (match) {
      const team = match[1].trim();
      const teamMembers = employees.filter(e => e.team && e.team.toLowerCase().includes(team));
      if (teamMembers.length > 0) {
        return `Members of the <b>${team}</b> team:<br/>` + teamMembers.map(e => `<b>${e.name}</b>`).join('<br/>');
      }
      return `I couldn't find anyone in the <b>${team}</b> team.`;
    }
    // Who is the [title]?
    let titleMatch = q.match(/who\s+is\s+(the\s+)?([a-z\s]+)/i);
    if (titleMatch) {
      const title = titleMatch[2].trim();
      // Avoid matching 'who is [name]' if a name exists
      const nameMatch = employees.find(e => e.name.toLowerCase() === title);
      if (!nameMatch) {
        // Find all employees with this title or designation (case-insensitive, partial match)
        const matches = employees.filter(e =>
          (e.title && e.title.toLowerCase().includes(title)) ||
          (e.designation && e.designation.toLowerCase().includes(title))
        );
        if (matches.length === 1) {
          const emp = matches[0];
          let summary = `<b>${emp.name}</b>`;
          if (emp.title) summary += `<br/><b>Title:</b> ${emp.title}`;
          if (emp.designation) summary += `<br/><b>Designation:</b> ${emp.designation}`;
          if (emp.team) summary += `<br/><b>Team:</b> ${emp.team}`;
          if (emp.email) summary += `<br/><b>Email:</b> ${emp.email}`;
          if (emp.phone) summary += `<br/><b>Phone:</b> ${emp.phone}`;
          return summary;
        } else if (matches.length > 1) {
          return `Employees with the title <b>${title}</b>:<br/>` + matches.map(emp => `<b>${emp.name}</b> (${emp.title || emp.designation || ''})`).join('<br/>');
        }
      }
    }
    // Who is [name]?
    let nameMatch = q.match(/who\s+is\s+([a-z\s]+)/i);
    if (nameMatch) {
      const name = nameMatch[1].trim();
      const emp = findEmployeeByName(employees, name);
      if (emp) {
        let summary = `<b>${emp.name}</b>`;
        if (emp.title) summary += `<br/><b>Title:</b> ${emp.title}`;
        if (emp.designation) summary += `<br/><b>Designation:</b> ${emp.designation}`;
        if (emp.team) summary += `<br/><b>Team:</b> ${emp.team}`;
        if (emp.email) summary += `<br/><b>Email:</b> ${emp.email}`;
        if (emp.phone) summary += `<br/><b>Phone:</b> ${emp.phone}`;
        return summary;
      }
      return `I couldn't find an employee named "${name}".`;
    }
    // Who is working under [name]?
    match = q.match(/who\s+(?:is\s+)?working\s+under\s+([a-z\s]+)/i) || q.match(/who\s+works\s+under\s+([a-z\s]+)/i);
    if (match) {
      const name = match[1].trim();
      const mgr = findEmployeeByName(employees, name);
      if (mgr) {
        const team = getTeam(employees, mgr);
        if (team.length > 0) {
          return `People reporting to <b>${mgr.name}</b>:<br/>` + team.map(e => `<b>${e.name}</b>${e.title ? ' (' + e.title + ')' : ''}${e.team ? ' - ' + e.team : ''}`).join('<br/>');
        }
        return `No one reports to <b>${mgr.name}</b>.`;
      }
      return `I couldn't find an employee named "${name}".`;
    }
    // Who is [name] reporting to? / Who does [name] report(s|ing) to?
    match = q.match(/who\s+is\s+([a-z\s]+)\s+reporting\s+to\??/i) || q.match(/who\s+does\s+([a-z\s]+)\s+report(?:s|ing)?\s+to\??/i);
    if (match) {
      const name = match[1].trim();
      const emp = findEmployeeByName(employees, name);
      if (emp) {
        const mgr = getManager(employees, emp);
        if (mgr) {
          let summary = `<b>${emp.name}</b> is reporting to <b>${mgr.name}</b>`;
          if (mgr.title) summary += ` (<b>${mgr.title}</b>)`;
          if (mgr.team) summary += ` - ${mgr.team}`;
          return summary;
        }
        return `<b>${emp.name}</b> does not have a manager.`;
      }
      return `I couldn't find an employee named "${name}".`;
    }
    // List all employees
    if (q.match(/^(list|show|display) (all )?(the )?employees?$/i)) {
      if (employees.length === 0) return "Sorry, I can't access employee data right now.";
      return `<b>All employees:</b><br/>` + employees.map(e => {
        let line = `<b>${e.name}</b>`;
        if (e.title) line += ` <span style='color:#b26a00;'>(${e.title}</span>`;
        if (e.team) line += `, <span style='color:#00796b;'>${e.team} team</span>`;
        if (e.title) line += ")";
        return line;
      }).join('<br/>');
    }
    // Fallback: (pseudo) OpenAI API call placeholder
    // In a real app, you would call your backend or OpenAI here
    // return await fetch('/api/ask', { method: 'POST', body: JSON.stringify({ question }) })
    return "Sorry, I didn't understand. Try asking about an employee's manager, team, email, phone, or title.";
  }

  // Handle user clicking a choice button
  const handleChoice = (type) => {
    if (!pendingEmployee) return;
    let answer = '';
    if (type === 'email') answer = `<b>${pendingEmployee.name}</b>'s email is <b>${pendingEmployee.email || 'not available'}</b>.`;
    if (type === 'phone') answer = `<b>${pendingEmployee.name}</b>'s phone is <b>${pendingEmployee.phone || 'not available'}</b>.`;
    if (type === 'team') answer = `<b>${pendingEmployee.name}</b> is in the <b>${pendingEmployee.team || 'no team'}</b> team.`;
    if (type === 'title') {
      if (pendingEmployee.title && pendingEmployee.designation) {
        answer = `<b>${pendingEmployee.name}</b>'s title is <b>${pendingEmployee.title}</b>.<br/>Designation: <b>${pendingEmployee.designation}</b>.`;
      } else if (pendingEmployee.title) {
        answer = `<b>${pendingEmployee.name}</b>'s title is <b>${pendingEmployee.title}</b>.`;
      } else if (pendingEmployee.designation) {
        answer = `<b>${pendingEmployee.name}</b>'s designation is <b>${pendingEmployee.designation}</b>.`;
      } else {
        answer = `Sorry, I don't have a title/position for <b>${pendingEmployee.name}</b>.`;
      }
    }
    if (type === 'manager') {
      const mgr = getManager(employees, pendingEmployee);
      answer = mgr ? `<b>${pendingEmployee.name}</b> is managed by <b>${mgr.name}</b> (${mgr.title || ''}).` : `<b>${pendingEmployee.name}</b> does not have a manager.`;
    }
    setMessages(msgs => {
      const newMsgs = [...msgs];
      if (pendingMessageIdx !== null) newMsgs[pendingMessageIdx].choiceAnswered = true;
      return [...newMsgs, { sender: 'bot', text: answer }];
    });
    setPendingEmployee(null);
    setPendingMessageIdx(null);
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = { sender: 'user', text: input };
    setMessages(msgs => [...msgs, userMsg]);
    setInput('');
    setTyping(true);
    setTimeout(() => {
      const answer = answerQuestion(userMsg.text);
      if (typeof answer === 'object' && answer.type === 'choice') {
        setMessages(msgs => {
          const idx = msgs.length;
          setPendingMessageIdx(idx);
          return [...msgs, { sender: 'bot', text: `What do you want to know about <b>${answer.name}</b>?`, choice: true, choiceAnswered: false }];
        });
        setTyping(false);
        return;
      }
      setMessages(msgs => [...msgs, { sender: 'bot', text: answer }]);
      setTyping(false);
    }, 700);
  };

  return (
    <>
      {/* Floating Chatbot Button */}
      {!open && (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end">
          {showHint && (
            <div className="mb-2 px-4 py-2 rounded-xl bg-orange-400 text-white font-semibold shadow-lg animate-fade-in-up text-sm" style={{boxShadow:'0 2px 12px 0 rgba(251,168,36,0.18)'}}>
              Ask me anything!
            </div>
          )}
          <button
            className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 shadow-2xl border-4 border-white/40 flex items-center justify-center text-white text-xl font-bold backdrop-blur-lg hover:scale-105 transition-all"
            style={{ boxShadow: '0 8px 32px 0 rgba(34,139,230,0.18)' }}
            onClick={() => setOpen(true)}
            aria-label="Open Chatbot"
          >
            <MessageCircle size={20} />
          </button>
        </div>
      )}
      {/* Chatbot Panel */}
      {open && (
        <div className="fixed bottom-4 right-4 z-50 w-[350px] max-w-[96vw] h-[480px] bg-[#fff5e0]/80 border-2 border-orange-300 rounded-2xl shadow-2xl flex flex-col animate-fade-in chatbot-bg-glass responsive-chatbot" style={{ boxShadow: '0 8px 32px 0 rgba(248,178,23,0.18)', backdropFilter: 'blur(14px)' }}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-orange-400 to-orange-300 rounded-t-2xl border-b border-orange-200 shadow-md">
            <span className="font-bold text-base sm:text-lg text-white tracking-tight flex items-center gap-2 drop-shadow-lg"><Bot size={20} /> Chatbot Assistant</span>
            <button onClick={() => setOpen(false)} className="text-white hover:bg-orange-500 rounded-full p-1 transition-all" aria-label="Close Chatbot">
              <X size={20} />
            </button>
          </div>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-2 custom-scrollbar relative chatbot-messages-bg">
            {messages.map((msg, idx) => (
              <div key={idx} className={`mb-3 flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex items-end gap-2 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                  <span className={`rounded-full bg-orange-400/90 text-white p-1.5 shadow-lg ${msg.sender === 'user' ? 'ml-1' : 'mr-1'}`}>
                    {msg.sender === 'user' ? <User size={18} /> : <Bot size={18} />}
                  </span>
                  <div className={`px-3 py-2 rounded-2xl max-w-[80vw] sm:max-w-[80%] text-sm sm:text-base shadow-lg transition-all duration-200 ${msg.sender === 'user' ? 'bg-orange-400 text-white rounded-br-sm' : 'bg-white/80 text-orange-900 rounded-bl-sm border border-orange-100/60'}`}
                    dangerouslySetInnerHTML={{ __html: msg.text }} />
                </div>
                {msg.choice && !msg.choiceAnswered && (
                  <div className="flex flex-wrap gap-2 mt-2 ml-10">
                    <button className="px-2 py-1 rounded bg-orange-200 text-orange-900 font-semibold shadow hover:bg-orange-300 text-xs sm:text-sm transition-all" onClick={() => handleChoice('email')}>Email</button>
                    <button className="px-2 py-1 rounded bg-orange-200 text-orange-900 font-semibold shadow hover:bg-orange-300 text-xs sm:text-sm transition-all" onClick={() => handleChoice('phone')}>Phone</button>
                    <button className="px-2 py-1 rounded bg-orange-200 text-orange-900 font-semibold shadow hover:bg-orange-300 text-xs sm:text-sm transition-all" onClick={() => handleChoice('team')}>Team</button>
                    <button className="px-2 py-1 rounded bg-orange-200 text-orange-900 font-semibold shadow hover:bg-orange-300 text-xs sm:text-sm transition-all" onClick={() => handleChoice('title')}>Title</button>
                    <button className="px-2 py-1 rounded bg-orange-200 text-orange-900 font-semibold shadow hover:bg-orange-300 text-xs sm:text-sm transition-all" onClick={() => handleChoice('manager')}>Manager</button>
                  </div>
                )}
              </div>
            ))}
            {typing && (
              <div className="mb-3 flex justify-start">
                <div className="flex items-end gap-2">
                  <span className="rounded-full bg-orange-400/90 text-white p-1.5 shadow-lg mr-1"><Bot size={18} /></span>
                  <div className="px-3 py-2 rounded-2xl max-w-[80vw] sm:max-w-[80%] text-sm sm:text-base shadow-lg bg-white/80 text-orange-900 rounded-bl-sm border border-orange-100/60 animate-pulse">Typing...</div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          {/* Input */}
          <div className="p-2 border-t border-orange-200 bg-[#fff5e0]/80 rounded-b-2xl shadow-inner">
            <form className="flex gap-2" onSubmit={e => { e.preventDefault(); handleSend(); }}>
              <input
                type="text"
                className="flex-1 px-3 py-2 rounded-xl border border-orange-200 bg-white/90 text-sm sm:text-base focus:ring-2 focus:ring-orange-400 outline-none shadow"
                placeholder="Ask about employees, teams, or anything..."
                value={input}
                onChange={e => setInput(e.target.value)}
                autoFocus={open}
              />
              <button
                type="submit"
                className="px-3 py-2 rounded-xl bg-gradient-to-br from-orange-400 to-orange-500 text-white font-bold shadow-lg hover:scale-105 text-sm sm:text-base transition-all"
                disabled={!input.trim()}
              >
                Send
              </button>
            </form>
            <div className="text-xs text-orange-700 mt-1 ml-1 opacity-80 select-none">Type <b>help</b> to see what questions you can ask.</div>
          </div>
        </div>
      )}
      {/* Extra styles for chatbot background pattern and glassmorphism */}
      <style>{`
        .chatbot-bg-glass {
          background: linear-gradient(120deg, #fffbe6 0%, #ffe0b2 40%, #ffd180 100%) !important;
          box-shadow: 0 8px 32px 0 rgba(248,178,23,0.18), 0 2px 16px 0 rgba(255,193,7,0.10);
          backdrop-filter: blur(14px) saturate(1.2);
          border: 2px solid rgba(255, 193, 7, 0.13);
        }
        .chatbot-messages-bg {
          background: repeating-linear-gradient(135deg, rgba(80, 50, 20, 0.012) 0 2px, transparent 2px 32px), radial-gradient(ellipse at top left, #ffe0b2 0%, #fffbe6 100%);
        }
        @media (max-width: 600px) {
          .responsive-chatbot {
            width: 98vw !important;
            min-width: 0 !important;
            height: 60vh !important;
            max-height: 80vh !important;
            border-radius: 1rem !important;
            right: 2vw !important;
            bottom: 2vw !important;
          }
          .responsive-chatbot .px-5, .responsive-chatbot .px-4, .responsive-chatbot .px-3 { padding-left: 0.5rem !important; padding-right: 0.5rem !important; }
          .responsive-chatbot .py-4, .responsive-chatbot .py-3, .responsive-chatbot .py-2 { padding-top: 0.5rem !important; padding-bottom: 0.5rem !important; }
          .responsive-chatbot input, .responsive-chatbot button { font-size: 0.95rem !important; }
        }
      `}</style>
    </>
  );
});

export default Chatbot; 