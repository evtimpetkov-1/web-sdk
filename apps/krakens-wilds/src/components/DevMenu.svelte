<script lang="ts">
	import { devCheatMode, setDevCheatMode, type DevCheatMode } from '../game/devMath';

	let active = $state(devCheatMode);

	function select(mode: DevCheatMode) {
		active = mode;
		setDevCheatMode(mode);
	}
</script>

<div class="dev-menu">
	<span class="label">DEV</span>
	<button class:active={active === 'none'} onclick={() => select('none')}>Normal</button>
	<button class:active={active === 'fs'} onclick={() => select('fs')}>Free Spins</button>
	<button class:active={active === 'retrigger'} onclick={() => select('retrigger')}>Retrigger</button>
	<button class:active={active === 'bigwin'} onclick={() => select('bigwin')}>Big Win</button>
</div>

<style>
	.dev-menu {
		position: fixed;
		top: 8px;
		left: 8px;
		z-index: 99999;
		display: flex;
		gap: 4px;
		align-items: center;
		background: rgba(0, 0, 0, 0.7);
		border-radius: 6px;
		padding: 4px 8px;
		font-family: monospace;
		font-size: 11px;
	}
	.label {
		color: #0f0;
		font-weight: bold;
		margin-right: 4px;
	}
	button {
		background: rgba(255, 255, 255, 0.1);
		color: #ccc;
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 4px;
		padding: 2px 8px;
		cursor: pointer;
		font-family: monospace;
		font-size: 11px;
	}
	button:hover {
		background: rgba(255, 255, 255, 0.2);
	}
	button.active {
		background: rgba(0, 200, 0, 0.3);
		color: #0f0;
		border-color: #0f0;
	}
</style>
