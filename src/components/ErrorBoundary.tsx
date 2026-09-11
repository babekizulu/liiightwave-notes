import { Component, type ReactNode } from 'react';
export default class ErrorBoundary extends Component<{children:ReactNode},{failed:boolean}> {
 state={failed:false};
 static getDerivedStateFromError(){return {failed:true};}
 render(){return this.state.failed?<main className="auth-page"><section className="auth-card" role="alert"><h1>Let’s reopen your notebook.</h1><p>The page ran into a problem. Your saved notes remain in your account.</p><button className="primary" onClick={()=>location.reload()}>Reload the page</button></section></main>:this.props.children;}
}
