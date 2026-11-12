import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { SWRConfig } from 'swr';
import Login from './index';
import api from '../../services/api';
import { isApiWaking, retryWhileWaking } from './demoAccess';

// react-router-dom 7 usa "exports", que o Jest do react-scripts 5 não resolve: simulamos só o Link.
jest.mock('react-router-dom', () => ({ Link: ({ to, children }) => <a href={to}>{children}</a> }), { virtual: true });
jest.mock('../../services/api', () => ({ __esModule: true, default: { get: jest.fn() } }));
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ signIn: jest.fn(), signInDemo: jest.fn() }),
}));
jest.mock('react-hot-toast', () => {
  const toast = jest.fn();
  toast.loading = jest.fn();
  toast.success = jest.fn();
  toast.error = jest.fn();
  toast.promise = jest.fn();
  return { __esModule: true, default: toast };
});

function renderLogin() {
  return render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
      <Login />
    </SWRConfig>,
  );
}

describe('Tela de entrada: demonstração independente do estado da API', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => { jest.useRealTimers(); jest.clearAllMocks(); });

  test('mostra as duas opções enquanto a API ainda não respondeu', () => {
    api.get.mockReturnValue(new Promise(() => {}));
    renderLogin();
    expect(screen.getByText('Como gestor do escritório')).toBeInTheDocument();
    expect(screen.getByText('Como cliente (portal)')).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  test('depois de 3 s sem resposta avisa que o servidor está iniciando e mantém as opções', () => {
    api.get.mockReturnValue(new Promise(() => {}));
    renderLogin();
    act(() => { jest.advanceTimersByTime(3100); });
    expect(screen.getByRole('status')).toHaveTextContent('está iniciando');
    expect(screen.getByText('Como gestor do escritório')).toBeInTheDocument();
  });

  test('se a API falhar, as opções continuam e o aviso aparece', async () => {
    api.get.mockRejectedValue(new Error('Network Error'));
    renderLogin();
    await act(async () => { await Promise.resolve(); });
    expect(screen.getByText('Como cliente (portal)')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  test('com a API pronta e demonstração ligada, some o aviso e as opções ficam', async () => {
    api.get.mockResolvedValue({ data: { demoEnabled: true, registrationOpen: false } });
    renderLogin();
    await act(async () => { await Promise.resolve(); });
    expect(screen.getByText('Como gestor do escritório')).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  test('se o servidor disser que a demonstração está desligada, as opções somem', async () => {
    api.get.mockResolvedValue({ data: { demoEnabled: false, registrationOpen: false } });
    renderLogin();
    await act(async () => { await Promise.resolve(); });
    expect(screen.queryByText('Como gestor do escritório')).not.toBeInTheDocument();
  });
});

describe('retryWhileWaking', () => {
  const waking = Object.assign(new Error('Network Error'), {});
  const unavailable = Object.assign(new Error('503'), { response: { status: 503 } });
  const invalid = Object.assign(new Error('400'), { response: { status: 400, data: { error: 'x' } } });
  const noWait = () => Promise.resolve();

  test('reconhece servidor acordando (sem resposta, 502, 503, 504) e não confunde com erro real', () => {
    expect(isApiWaking(waking)).toBe(true);
    expect(isApiWaking(unavailable)).toBe(true);
    expect(isApiWaking(invalid)).toBe(false);
  });

  test('tenta de novo até o servidor responder e informa cada espera', async () => {
    const action = jest.fn().mockRejectedValueOnce(waking).mockRejectedValueOnce(unavailable).mockResolvedValue('ok');
    const onWait = jest.fn();
    await expect(retryWhileWaking(action, { wait: noWait, onWait })).resolves.toBe('ok');
    expect(action).toHaveBeenCalledTimes(3);
    expect(onWait).toHaveBeenNthCalledWith(1, 1, 8);
    expect(onWait).toHaveBeenNthCalledWith(2, 2, 8);
  });

  test('não insiste em erro real da API', async () => {
    const action = jest.fn().mockRejectedValue(invalid);
    await expect(retryWhileWaking(action, { wait: noWait })).rejects.toBe(invalid);
    expect(action).toHaveBeenCalledTimes(1);
  });

  test('desiste depois do limite de tentativas', async () => {
    const action = jest.fn().mockRejectedValue(waking);
    await expect(retryWhileWaking(action, { attempts: 3, wait: noWait })).rejects.toBe(waking);
    expect(action).toHaveBeenCalledTimes(3);
  });
});
