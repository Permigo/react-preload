import React, { PropTypes, Component } from 'react';
import ImageHelper from './ImageHelper';

const propTypes = {
    // Rendered on success
    children: PropTypes.node.isRequired,

    // Rendered during load
    loadingIndicator: PropTypes.node.isRequired,

    // Array of image urls to be preloaded
    images: PropTypes.array,

    // If set, the preloader will automatically show
    // the children content after this amount of time
    autoResolveDelay: PropTypes.number,

    // Error callback. Is passed the error
    onError: PropTypes.func,

    // Success callback
    onSuccess: PropTypes.func,

    // Whether or not we should still show the content
    // even if there is a preloading error
    resolveOnError: PropTypes.bool,

    // Whether or not we should mount the child content after
    // images have finished loading (or after autoResolveDelay)
    mountChildren: PropTypes.bool
};

const defaultProps = {
    images: [],
    resolveOnError: true,
    mountChildren: true
};

class Preload extends Component {
    constructor(props) {
        super(props);

        this.state = {
            ready: false
        };

        this._handleSuccess = this._handleSuccess.bind(this);
        this._handleError = this._handleError.bind(this);
        this._preload = this._preload.bind(this);

        this._isMounted = false
    }

    componentWillMount() {
        if (!this.props.images || this.props.images.length === 0) {
            this._handleSuccess();
        }
    }

    componentDidMount() {
        this._preload(this.props, this.state);
        this._isMounted = true
    }

    componentWillReceiveProps(nextProps) {
        let imagesChanged = false;
        if (nextProps.images.length !== this.props.images.length) {
            imagesChanged = true;
        }

        for (let i = 0; i < nextProps.images.length; ++i) {
            if (nextProps.images[i] !== this.props.images[i]) {
                imagesChanged = true;
                break;
            }
        }

        if (imagesChanged) {
            this.setState({
                ready: false
            })
        }
    }

    componentWillUpdate(nextProps, nextState) {
        this._preload(nextProps, nextState);
    }

    componentWillUnmount() {
        if (this.autoResolveTimeout) {
            clearTimeout(this.autoResolveTimeout);
        }
        this._isMounted = false
    }

    _handleSuccess() {
        if (this.autoResolveTimeout) {
            clearTimeout(this.autoResolveTimeout);
            console.warn('images failed to preload, auto resolving');
        }

        if (this.state.ready || !this._isMounted) {
            return;
        }

        this.setState({
            ready: true
        });

        if (this.props.onSuccess) {
            this.props.onSuccess();
        }
    }

    _handleError(err) {
        if (this.props.resolveOnError) {
            this._handleSuccess();
        }

        if (this.props.onError) {
            this.props.onError(err);
        }
    }

    _preload(props, state) {
        if (!state.ready) {
            ImageHelper
                .loadImages(props.images)
                .then(this._handleSuccess, this._handleError);

            if (props.autoResolveDelay && props.autoResolveDelay > 0) {
                this.autoResolveTimeout = setTimeout(this._handleSuccess, props.autoResolveDelay);
            }
        }
    }

    render() {
        return (this.state.ready && this.props.mountChildren ? this.props.children : this.props.loadingIndicator);
    }
}

Preload.propTypes = propTypes;
Preload.defaultProps = defaultProps;

export default Preload;
